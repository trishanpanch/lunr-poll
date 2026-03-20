#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# sync-design-system.sh
#
# Copies the design system page from this Manus prototype into the
# harvard-poll Next.js repo and pushes a branch for review.
#
# Usage:
#   bash sync-design-system.sh [branch-suffix]
#
# Example:
#   bash sync-design-system.sh         → branch: sync/design-system-20260320
#   bash sync-design-system.sh v1.1    → branch: sync/design-system-v1.1
#
# Prerequisites:
#   - harvard-poll repo cloned at /home/ubuntu/harvard-poll
#   - gh CLI authenticated
# ─────────────────────────────────────────────────────────────────────────────

set -e

MANUS_DS="$(dirname "$0")/client/src/pages/DesignSystem.tsx"
HARVARD_DS="/home/ubuntu/harvard-poll/src/app/design-system/page.tsx"
HARVARD_REPO="/home/ubuntu/harvard-poll"

SUFFIX="${1:-$(date +%Y%m%d)}"
BRANCH="sync/design-system-${SUFFIX}"

echo "──────────────────────────────────────────────"
echo "  Harvard Poll — Design System Sync"
echo "──────────────────────────────────────────────"
echo "  Source : $MANUS_DS"
echo "  Target : $HARVARD_DS"
echo "  Branch : $BRANCH"
echo "──────────────────────────────────────────────"

# 1. Verify source exists
if [ ! -f "$MANUS_DS" ]; then
  echo "❌  Source file not found: $MANUS_DS"
  exit 1
fi

# 2. Verify harvard-poll repo exists
if [ ! -d "$HARVARD_REPO" ]; then
  echo "❌  harvard-poll repo not found at $HARVARD_REPO"
  echo "    Run: gh repo clone Harvard-Poll/harvard-poll /home/ubuntu/harvard-poll"
  exit 1
fi

# 3. Ensure we're on main and up to date
cd "$HARVARD_REPO"
git fetch origin main --quiet
git checkout main --quiet
git pull origin main --quiet
echo "✓  harvard-poll is up to date on main"

# 4. Create or reset the sync branch
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH" --quiet
  git reset --hard origin/main --quiet
  echo "✓  Reset existing branch $BRANCH to main"
else
  git checkout -b "$BRANCH" --quiet
  echo "✓  Created branch $BRANCH"
fi

# 5. Ensure destination directory exists
mkdir -p "$(dirname "$HARVARD_DS")"

# 6. Copy the file
# The Manus version uses React + Vite conventions; convert to Next.js:
#   - Add "use client" directive at the top
#   - Keep everything else identical (same tokens, same components)
{
  echo '"use client";'
  echo '// AUTO-SYNCED from Manus session-builder-app — DO NOT EDIT MANUALLY'
  echo "// Last synced: $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo "// Source: client/src/pages/DesignSystem.tsx"
  echo ""
  # Strip the Manus design comment block at the top (lines starting with /* ──)
  # and output the rest of the file
  tail -n +$(grep -n "^import" "$MANUS_DS" | head -1 | cut -d: -f1) "$MANUS_DS"
} > "$HARVARD_DS"

echo "✓  Copied and adapted DesignSystem.tsx → $HARVARD_DS"

# 7. Commit
git add "$HARVARD_DS"
git commit -m "sync: design system page from Manus prototype ($(date -u '+%Y-%m-%d'))" \
  --author="aliceclebeau <aliceclebeau@gmail.com>" \
  --quiet
echo "✓  Committed"

# 8. Push
git push origin "$BRANCH" --force --quiet
echo "✓  Pushed $BRANCH to GitHub"

# 9. Open or update PR
EXISTING_PR=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")

if [ -n "$EXISTING_PR" ]; then
  echo "✓  PR #$EXISTING_PR already exists — branch updated"
  echo "   https://github.com/Harvard-Poll/harvard-poll/pull/$EXISTING_PR"
else
  PR_URL=$(gh pr create \
    --title "sync: Design system page update ($(date -u '+%Y-%m-%d'))" \
    --body "Auto-synced from the Manus session-builder-app prototype.

**What changed:** See the commit diff — tokens, components, and patterns are kept in sync with the Manus design iteration environment.

**To adopt:** Merge this PR. The page is accessible at \`/design-system\` (password: \`lunr\`)." \
    --base main \
    --head "$BRANCH" 2>&1)
  echo "✓  PR created: $PR_URL"
fi

echo ""
echo "──────────────────────────────────────────────"
echo "  Sync complete ✓"
echo "──────────────────────────────────────────────"
