#!/usr/bin/env bash
# sync-from-vault.sh — tag-based publishing from Obsidian vault.
# ----------------------------------------------------------------------
# Walks the entire vault and copies any .md note whose frontmatter has
#     publish: true
#     draft:   false   (must be EXPLICITLY present)
# into this repo's content/posts/. A note with `draft: true` or with no
# `draft` field at all is skipped, even if publish is on. Requiring an
# explicit draft:false forces an opt-in: a fresh note doesn't leak just
# because the user happened to flip publish on.
#
# Why this model instead of mapping specific folders?
#   - Vault organization (daily notes, research, archive) becomes
#     independent of what's public — move notes freely without breaking
#     publication.
#   - Publishing is a single-bit decision at the note level.
#   - Unpublishing is symmetric: flip the flag, re-run sync.
#
# Attachments (selective sync):
#   For each published note we scan the body for Obsidian wiki-embed
#   image references — `![[file.png]]`, `![[path/file.png|alt]]`, etc.
#   For each reference we look up the file by basename inside
#   $VAULT/06_Public_Attachments/ and copy it to $REPO/public/attachments/.
#   The reference in the synced .md is rewritten to standard markdown so
#   Astro renders it (it doesn't understand the wiki syntax).
#
#   - Images dropped in 05_Attachments/ stay private. The folder split
#     enforces a publish gate symmetric to publish:true on notes.
#   - The repo only grows by what's actually displayed on the site —
#     unused images in 06_Public_Attachments/ never make it to git.
#   - Currently handles images only (.png/.jpg/.jpeg/.gif/.svg/.webp).
#     PDFs / videos can be added later by extending IMG_EXT.
#
# Cross-note links:
#   Obsidian wiki links — `[[Other Note]]`, `[[Other Note|Display]]` —
#   are resolved against the set of notes that pass the publish gate
#   THIS run, then rewritten to standard markdown links pointing at the
#   target's permalink (`/posts/<slug>`). Astro doesn't understand the
#   wiki syntax, and even if it did, the vault's folder structure is
#   flattened into content/posts/ on sync — there's no general way for
#   the renderer to know which slug "Other Note" maps to.
#
#   - Unpublished or non-existent targets are LEFT INTACT (literal
#     `[[…]]` in the rendered HTML) and reported as a warning. The
#     visible breakage is intentional: it surfaces the broken link to
#     the author before they ship.
#   - Heading anchors (`[[X#Heading]]`) are accepted in the source but
#     the `#Heading` part is dropped in v1 — the link points at the
#     post page. To activate heading anchors, install rehype-slug into
#     astro.config.mjs and extend the rewriter below to slugify the
#     heading the same way.
#   - Block references (`[[X^block]]`) are not supported.
# ----------------------------------------------------------------------

set -euo pipefail

VAULT="${VAULT:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Workspace}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_DIR="$REPO_ROOT/content/posts"
REPO_ONLY="$REPO_ROOT/content/repo-only"
ATTACHMENTS_VAULT="${ATTACHMENTS_VAULT:-$VAULT/06_Public_Attachments}"
PRIVATE_ATTACHMENTS_VAULT="${PRIVATE_ATTACHMENTS_VAULT:-$VAULT/05_Attachments}"
ATTACHMENTS_DIR="$REPO_ROOT/public/attachments"

# Image extensions the embed scanner recognises. Keep as a single
# regex-friendly alternation. To support more types (e.g. PDFs), add
# them here AND ensure the rewriter (perl regex below) lists them too.
IMG_EXT='png|jpg|jpeg|gif|svg|webp'

echo "📁 repo:        $REPO_ROOT"
echo "📁 vault:       $VAULT"
echo "📁 attachments: $ATTACHMENTS_VAULT"
if [ ! -d "$VAULT" ]; then
  echo "❌ Vault path not found. Set the VAULT env var or fix the default in the script."
  exit 1
fi

# Fresh slate for synced posts and attachments; never touch repo-only.
# Both directories are entirely managed by sync — anything in them at
# the top of the run is presumed stale.
rm -rf "$POSTS_DIR"
mkdir -p "$POSTS_DIR"
rm -rf "$ATTACHMENTS_DIR"
mkdir -p "$ATTACHMENTS_DIR"

published=0
skipped_draft=0
skipped_nodraft=0
attached=0
missing=0
unpublished_link=0

# Working tempfiles. SLUG_MAP is the {filename_stem -> slug} table that
# the link rewriter consults; PUBLISHABLE is the {vault_path -> slug}
# work queue for phase 2.
SLUG_MAP=$(mktemp)
PUBLISHABLE=$(mktemp)
trap 'rm -f "$SLUG_MAP" "$PUBLISHABLE"' EXIT

# ---------- helpers ----------

# process_attachments TARGET_MD
#   Scans TARGET_MD for ![[file.ext]] image embeds, copies the source
#   file from $ATTACHMENTS_VAULT into $ATTACHMENTS_DIR (basename match,
#   deduplicated by destination existence), then rewrites the embed in
#   TARGET_MD to standard markdown that Astro can render.
#
#   Lookup strategy: search ATTACHMENTS_VAULT recursively for a file
#   matching the basename. If none match, the reference is reported and
#   left in the body as-is — the build will simply show a broken image
#   placeholder, which is the right loud failure.
#
#   We deliberately do NOT search 05_Attachments/ — that's the privacy
#   gate. To publish an image you must move it (or symlink it) into
#   06_Public_Attachments/.
process_attachments() {
  local target="$1"

  # 1) Extract the unique set of basenames referenced via wiki embeds.
  local refs
  refs=$(perl -ne '
    while (m{!\[\[([^|\]]+\.(?:'"$IMG_EXT"'))(?:\|[^\]]*)?\]\]}gi) {
      my $p = $1;
      $p =~ s|.*/||;            # strip any vault subpath, keep basename
      print "$p\n";
    }
  ' "$target" | sort -u)

  # 2) For each basename, locate it in the public attachments folder
  #    and copy it (skip if already copied this run).
  while IFS= read -r basename; do
    [ -z "$basename" ] && continue

    if [ -e "$ATTACHMENTS_DIR/$basename" ]; then
      continue   # already copied earlier in this run
    fi

    local src
    src=$(find "$ATTACHMENTS_VAULT" -type f -name "$basename" 2>/dev/null | head -1)

    if [ -z "$src" ]; then
      echo "  ⚠️  missing-attachment: $basename (referenced by $(basename "$target"))"
      missing=$((missing + 1))
      continue
    fi

    cp "$src" "$ATTACHMENTS_DIR/$basename"
    attached=$((attached + 1))
    echo "    📎 attachment: $basename"
  done <<< "$refs"

  # 3) Rewrite wiki embeds in the target to standard markdown so that
  #    Astro's markdown renderer picks them up. The destination path is
  #    always /attachments/<basename> even when the source had a subpath
  #    like ![[diagrams/foo.png]].
  #
  #    We use read-then-truncate-write rather than perl -i because some
  #    filesystems (notably bindfs in cowork sandboxes) block the unlink
  #    that perl -i performs internally. Open-write-truncate is allowed.
  perl -e '
    my $f = $ARGV[0];
    open(my $fh, "<", $f) or die "read $f: $!";
    local $/; my $c = <$fh>; close $fh;

    my $ext = "'"$IMG_EXT"'";
    # ![[path/file.ext|alt]] → ![alt](/attachments/file.ext)
    $c =~ s{!\[\[([^|\]]+\.(?:$ext))\|([^\]]*)\]\]}{
      my ($p, $alt) = ($1, $2);
      $p =~ s|.*/||;
      "![$alt](/attachments/$p)";
    }gei;
    # ![[path/file.ext]]    → ![file](/attachments/file.ext)  (alt = stem)
    $c =~ s{!\[\[([^|\]]+\.(?:$ext))\]\]}{
      my $p = $1;
      $p =~ s|.*/||;
      my $alt = $p;
      $alt =~ s|\.[^.]+$||;
      "![$alt](/attachments/$p)";
    }gei;

    open(my $out, ">", $f) or die "write $f: $!";
    print $out $c; close $out;
  ' "$target"
}

# process_links TARGET_MD SLUG_MAP_FILE
#   Rewrites Obsidian wiki cross-note links to standard markdown.
#   Patterns handled: [[X]], [[X|Y]], [[X#H]], [[X#H|Y]]. Image embeds
#   (![[...]]) are excluded via a negative-lookbehind on `!`.
#
#   For each link target X (filename stem, no .md):
#     - if X is a publishable note this run: rewrite to [Y or X](/posts/<slug>)
#     - else: leave the [[…]] intact and emit a warning (the broken
#       wiki text is visible on the rendered page — loud failure).
#
#   Heading anchors are silently dropped in v1 (would need rehype-slug
#   in astro.config.mjs to actually activate them). Block refs (^id)
#   aren't supported and would not match the pattern below either.
#
#   Returns the count of unpublished-link warnings via stdout, so the
#   caller can fold it into the run-wide tally.
process_links() {
  local target="$1"
  local map="$2"
  local fname
  fname="$(basename "$target")"

  local count
  count=$(perl -e '
    my ($map_file, $f, $fname) = @ARGV;

    # Keys are lowercased so that [[loop closure]], [[Loop Closure]],
    # and [[LOOP CLOSURE]] all resolve to the same target. Mirrors
    # Obsidian-side case-insensitive link resolution and matches the
    # lowercase URL slugs that Astro produces from filenames.
    my %map;
    open(my $mh, "<", $map_file) or die "open map: $!";
    while (<$mh>) {
      chomp;
      my @parts = split /\t/, $_, 2;
      $map{lc $parts[0]} = $parts[1] if @parts == 2;
    }
    close $mh;

    open(my $fh, "<", $f) or die "read $f: $!";
    local $/; my $c = <$fh>; close $fh;

    my $unpublished = 0;
    # Match [[X]], [[X|Y]], [[X#H]], [[X#H|Y]]. The (?<!!) lookbehind
    # excludes image embeds, which were already handled by the
    # attachment pass. The body of X cannot contain |, ], or # — those
    # delimit the optional pieces.
    $c =~ s{(?<!!)\[\[([^|\]#]+)((?:#[^|\]]+)?)(?:\|([^\]]+))?\]\]}{
      my ($name, $heading, $alt) = ($1, $2, $3);
      $name =~ s/^\s+|\s+$//g;
      my $key = lc $name;
      if (exists $map{$key}) {
        my $display = (defined $alt && $alt ne "") ? $alt : $name;
        my $url = "/posts/" . $map{$key};
        # heading is dropped in v1 — see header comment for why
        "[$display]($url)";
      } else {
        $unpublished++;
        print STDERR "  ⚠️  unpublished-link: $name (in $fname)\n";
        $&;  # leave the original [[…]] intact
      }
    }ge;

    open(my $out, ">", $f) or die "write $f: $!";
    print $out $c; close $out;

    print $unpublished;
  ' "$map" "$target" "$fname")

  unpublished_link=$((unpublished_link + count))
}

# Computed slug for a vault filename. Spaces → hyphens; ASCII letters
# lowercased; everything else preserved (Unicode safe). The lowercase
# step matters because Astro's content-layer glob loader lowercases the
# entry id when deriving the URL — so `Loop Closure.md` becomes route
# `/posts/loop-closure/`. If sync produced a capital-cased slug, the
# rewritten cross-links would 404. Spelling case is normalised away
# everywhere in the pipeline; the original filename is preserved only
# inside the vault.
to_slug() {
  echo "$1" | tr ' ' '-' | tr '[:upper:]' '[:lower:]'
}

# ---------- Phase 1: discover publishable notes, build slug map ----------
# We do publish-gate checks and slug allocation up front, so that Phase
# 2's link rewriter has a complete view of which targets exist before
# any rewriting happens. Skip messages (`draft:`, `no-draft:`) are
# emitted here so the user sees them in chronological vault order.

while IFS= read -r -d '' file; do
  head="$(head -40 "$file")"

  # Must have publish: true.
  if ! printf '%s\n' "$head" | grep -qE '^publish:[[:space:]]*true[[:space:]]*$'; then
    continue
  fi

  # draft: true → skip (loud).
  if printf '%s\n' "$head" | grep -qE '^draft:[[:space:]]*true[[:space:]]*$'; then
    skipped_draft=$((skipped_draft + 1))
    echo "  ⏸  draft:    $(basename "$file")"
    continue
  fi

  # draft missing → skip (also loud — explicit opt-in required).
  if ! printf '%s\n' "$head" | grep -qE '^draft:[[:space:]]*false[[:space:]]*$'; then
    skipped_nodraft=$((skipped_nodraft + 1))
    echo "  ⏸  no-draft: $(basename "$file")"
    continue
  fi

  stem="$(basename "$file" .md)"
  slug="$(to_slug "$stem")"

  # Slug collision: if a previously discovered note already claimed
  # this slug, append -2, -3, … until free. Note this is a slug-level
  # check (not stem) — two stems differing only in spaces would still
  # produce the same slug.
  base_slug="$slug"
  n=2
  while cut -f2 "$SLUG_MAP" 2>/dev/null | grep -qFx "$slug"; do
    slug="${base_slug}-$n"
    n=$((n + 1))
  done

  printf '%s\t%s\n' "$stem" "$slug" >> "$SLUG_MAP"
  printf '%s\t%s\n' "$file" "$slug" >> "$PUBLISHABLE"
done < <(
  find "$VAULT" \
    \( -name '.obsidian' -o -name '.trash' -o -name 'templates' \
       -o -name '.git'  -o -name 'node_modules' \
       -o -path "$ATTACHMENTS_VAULT" -o -path "$PRIVATE_ATTACHMENTS_VAULT" \) -prune -o \
    -type f -name '*.md' -print0
)

# ---------- Phase 2: copy each publishable, then rewrite ----------
# We copy first, then run process_attachments and process_links on the
# copy. Rewrites mutate the synced file, never the vault.

while IFS=$'\t' read -r file slug; do
  target="$POSTS_DIR/$slug.md"
  cp "$file" "$target"
  echo "  ✅ publish:  $(basename "$target")"
  published=$((published + 1))
  process_attachments "$target"
  process_links "$target" "$SLUG_MAP"
done < "$PUBLISHABLE"

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "✅ Published $published note(s)."
echo "   Skipped: $skipped_draft draft, $skipped_nodraft no-draft-field."
echo "📎 Attachments: $attached copied, $missing missing reference(s)."
echo "🔗 Cross-links: $unpublished_link unpublished target(s) left intact."
if [ -d "$REPO_ONLY" ]; then
  n=$(find "$REPO_ONLY" -type f -name '*.md' | wc -l | tr -d ' ')
  echo "🔒 Preserved $n repo-only note(s) (not touched by sync)."
fi
