#!/usr/bin/env bash
# Commit each of the first 53 changed/untracked files individually with a descriptive message and a fixed date.

set -euo pipefail

# Get the first 53 lines of git status (porcelain format)
git status --porcelain | head -n 53 | while IFS= read -r line; do
  # Extract the two-character status code (e.g., " M", "??", etc.)
  status="${line:0:2}"
  # Extract the file path, removing the leading space after the status code
  file="${line:3}"
  file="${file# }"

  # Build a descriptive commit message
  if [[ "$status" == "M " ]]; then
    msg="Update $file"
  elif [[ "$status" == "??" ]]; then
    msg="Add $file"
  else
    msg="Change $file"
  fi

  # Stage the file
  git add "$file"

  # Commit with the fixed timestamp
  git commit --date="Mon Jul 13 2026 23:23:00 +0200" -m "$msg"

  # Inform the user
  echo "Committed: $msg"
done