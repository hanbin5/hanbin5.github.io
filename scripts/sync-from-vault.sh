#!/usr/bin/env bash
# sync-from-vault.sh — tag-based publishing from Obsidian vault.
# ----------------------------------------------------------------------
# Walks the entire vault and copies any .md note whose frontmatter has
#     publish: true
# into this repo's content/posts/. Notes with `draft: true` are skipped
# even if publish is on, so drafts never leak.
#
# Why this model instead of mapping specific folders?
#   - Vault organization (daily notes, research, archive) becomes
#     independent of what's public — move notes freely without breaking
#     publication.
#   - Publishing is a single-bit decision at the note level.
#   - Unpublishing is symmetric: flip the flag, re-run sync.
#
# Attachments:
#   Images referenced via ![[...]] (Obsidian wiki embed) are NOT auto-
#   copied — see obsidian-templates/README.md for the recommended
#   /attachments/ workflow.
# ----------------------------------------------------------------------

set -euo pipefail

VAULT="${VAULT:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Workspace}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_DIR="$REPO_ROOT/content/posts"
REPO_ONLY="$REPO_ROOT/content/repo-only"

echo "📁 repo:  $REPO_ROOT"
echo "📁 vault: $VAULT"
if [ ! -d "$VAULT" ]; then
  echo "❌ Vault path not found. Set the VAULT env var or fix the default in the script."
  exit 1
fi

# Fresh slate for synced posts; never touch repo-only or other folders.
rm -rf "$POSTS_DIR"
mkdir -p "$POSTS_DIR"

published=0
skipped_draft=0

# Scan the vault. Skip obvious noise directories.
while IFS= read -r -d '' file; do
  # Read only the frontmatter region (safely capped at 40 lines).
  head="$(head -40 "$file")"

  # Must have `publish: true`. Grep with anchors so `publish: false` or
  # `publish-later: true` don't match by accident.
  if ! printf '%s\n' "$head" | grep -qE '^publish:[[:space:]]*true[[:space:]]*$'; then
    continue
  fi

  # Respect an explicit `draft: true` — never publish drafts.
  if printf '%s\n' "$head" | grep -qE '^draft:[[:space:]]*true[[:space:]]*$'; then
    skipped_draft=$((skipped_draft + 1))
    echo "  ⏸  draft:  $(basename "$file")"
    continue
  fi

  # Slug = filename stem, normalized (spaces → hyphens, keep unicode).
  slug="$(basename "$file" .md | tr ' ' '-')"
  target="$POSTS_DIR/$slug.md"

  # If two vault notes collide on slug, suffix with a counter.
  if [ -e "$target" ]; then
    n=2
    while [ -e "$POSTS_DIR/${slug}-$n.md" ]; do
      n=$((n + 1))
    done
    target="$POSTS_DIR/${slug}-$n.md"
  fi

  cp "$file" "$target"
  echo "  ✅ publish: $(basename "$target")"
  published=$((published + 1))
done < <(
  find "$VAULT" \
    \( -name '.obsidian' -o -name '.trash' -o -name 'templates' \
       -o -name '.git'  -o -name 'node_modules' \) -prune -o \
    -type f -name '*.md' -print0
)

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "✅ Published $published note(s). Skipped $skipped_draft draft(s)."
if [ -d "$REPO_ONLY" ]; then
  n=$(find "$REPO_ONLY" -type f -name '*.md' | wc -l | tr -d ' ')
  echo "🔒 Preserved $n repo-only note(s) (not touched by sync)."
fi
