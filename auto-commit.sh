#!/bin/bash

# Path to your repository (default: current directory)
REPO_PATH="$(pwd)"
# Branch to commit to
BRANCH="main"
# Remote repository name
REMOTE="origin"
# Debounce time (seconds) to batch changes
DEBOUNCE=5

# Ensure we're in a Git repository
cd "$REPO_PATH" || exit 1
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: Not a Git repository"
  exit 1
fi

# Function to commit changes
commit_changes() {
  # Check if there are changes to commit
  if git status --porcelain | grep . >/dev/null; then
    echo "Changes detected, committing..."
    git add --all
    git commit -m "Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Committed changes"
    # Optional: Push to remote (uncomment to enable)
    # git push "$REMOTE" "$BRANCH"
  else
    echo "No changes to commit"
  fi
}

# Watch for changes using watchman
echo "Starting watchman to monitor $REPO_PATH..."
watchman watch "$REPO_PATH"
watchman -- trigger "$REPO_PATH" auto-commit '*' -- "$0"

# Main loop to handle watchman triggers
while true; do
  # Wait for changes (watchman will trigger this script)
  sleep "$DEBOUNCE"
  commit_changes
done