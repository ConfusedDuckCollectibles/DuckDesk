#!/usr/bin/env bash
# Builds the overlay and replaces the overlay bundle inside an already-installed
# Duck Desk.app. The packaged app serves Contents/Resources/overlay, so without
# this step a rebuilt overlay is only visible to `npm run dev:desktop`.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_path="${1:-/Applications/Duck Desk.app}"
target="$app_path/Contents/Resources/overlay"

if [[ ! -d "$app_path" ]]; then
  echo "No app bundle at: $app_path" >&2
  exit 1
fi

echo "Building overlay..."
npm run build -w @duck-desk/overlay --prefix "$repo_root"

echo "Syncing into $target"
rm -rf "$target"
mkdir -p "$target"
cp -R "$repo_root/apps/overlay/dist/." "$target/"

echo "Restarting Duck Desk..."
pkill -f "Duck Desk.app/Contents/MacOS/Duck Desk" 2>/dev/null || true
sleep 1

# Editing files inside the bundle invalidates the existing signature, and macOS
# then refuses to launch the app. Re-sign ad-hoc so it stays runnable.
codesign --force --deep --sign - "$app_path" >/dev/null 2>&1 || true
xattr -cr "$app_path" 2>/dev/null || true

# ELECTRON_RUN_AS_NODE makes the packaged app exit immediately instead of
# starting its window and local bridge, and `open` forwards it.
env -u ELECTRON_RUN_AS_NODE open -a "$app_path"

echo "Done. Refresh the OBS browser source cache."
