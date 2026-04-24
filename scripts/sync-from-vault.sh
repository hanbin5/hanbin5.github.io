#!/usr/bin/env bash
# sync-from-vault.sh
# ----------------------------------------------------------------------
# Mirror the "public" subtrees of the Obsidian vault into this repo's
# content/ directory, so Astro can build from them.
#
# Rules:
#   - Vault is the source of truth for synced folders.
#   - Anything authored directly in repo at content/repo-only/ is preserved.
#   - Files with `draft: true` in frontmatter are stripped before build.
# ----------------------------------------------------------------------

set -euo pipefail

VAULT="${VAULT:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/Workspace}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT="$REPO_ROOT/content"

# (vault-subpath) : (content-subfolder)
PUBLISH_MAP=(
  "60_Writing/64_Blog:posts"
  "20_Concepts:concepts"
  "40_Projects/44_Public:projects"
  "06_Public_Attachments:attachments"
)

# Folders that are managed in the repo itself — never touched by sync.
PRESERVE_DIRS=(
  "repo-only"
)

echo "📁 repo: $REPO_ROOT"
echo "📁 vault: $VAULT"
if [ ! -d "$VAULT" ]; then
  echo "❌ Vault path not found. Set the VAULT env var or fix the default in the script."
  exit 1
fi

# Back up preserve dirs, wipe non-preserved content, restore.
TMP=$(mktemp -d)
for d in "${PRESERVE_DIRS[@]}"; do
  if [ -d "$CONTENT/$d" ]; then
    cp -R "$CONTENT/$d" "$TMP/"
  fi
done

# Remove synced subfolders only; leave preserved ones alone.
for mapping in "${PUBLISH_MAP[@]}"; do
  dst="${mapping##*:}"
  rm -rf "$CONTENT/$dst"
done

# Fresh sync from vault.
for mapping in "${PUBLISH_MAP[@]}"; do
  src="${mapping%%:*}"
  dst="${mapping##*:}"
  if [ -d "$VAULT/$src" ]; then
    echo "📂 $src → content/$dst"
    mkdir -p "$CONTENT/$dst"
    rsync -av --delete \
      --exclude='.obsidian' \
      --exclude='.trash' \
      --exclude='*.canvas' \
      --exclude='templates' \
      --exclude='.DS_Store' \
      "$VAULT/$src/" "$CONTENT/$dst/" > /dev/null
  else
    echo "⚠️  $VAULT/$src not found — skipping."
  fi
done

# Restore preserved dirs (repo-only content).
for d in "${PRESERVE_DIRS[@]}"; do
  if [ -d "$TMP/$d" ]; then
    rm -rf "$CONTENT/$d"
    mv "$TMP/$d" "$CONTENT/$d"
  fi
done
rm -rf "$TMP"

# Strip drafts: any .md with `draft: true` in the first 25 frontmatter lines.
echo "🔍 filtering drafts…"
draft_count=0
while IFS= read -r -d '' file; do
  if head -25 "$file" | grep -qE '^draft:[[:space:]]*true[[:space:]]*$'; then
    echo "  ✂️  ${file#$CONTENT/}"
    rm "$file"
    draft_count=$((draft_count + 1))
  fi
done < <(find "$CONTENT" -type f -name '*.md' -print0)
echo "🔍 $draft_count draft(s) removed."

echo "✅ Vault sync complete."
