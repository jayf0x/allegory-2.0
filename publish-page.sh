#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-}

if [[ -z "$VERSION" ]]; then
  LATEST=$(git tag --list 'v*' --sort=-v:refname | head -n1)
  if [[ -z "$LATEST" ]]; then
    VERSION="v0.1.0"
  else
    MAJOR=$(echo "$LATEST" | cut -d. -f1 | tr -d v)
    MINOR=$(echo "$LATEST" | cut -d. -f2)
    PATCH=$(echo "$LATEST" | cut -d. -f3)
    VERSION="v${MAJOR}.${MINOR}.$((PATCH + 1))"
  fi
fi

echo "Releasing $VERSION..."

# Bump version in package.json and commit so main gets a new push (triggers deploy)
bun pm pkg set "version=${VERSION#v}"
git add package.json
git commit -m "chore: release $VERSION"
git tag "$VERSION"
git push origin main
git push origin "$VERSION"

echo "Done. Watch the action at: https://github.com/jayf0x/allegory-2.0/actions"
