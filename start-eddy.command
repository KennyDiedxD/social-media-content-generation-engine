#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Eddy Social Manager..."

osascript <<EOF
tell application "Terminal"
    activate

    do script "cd '$PROJECT_DIR' && npm run dev"

    do script "cd '$PROJECT_DIR/frontend' && npm run dev"
end tell
EOF

sleep 5

open "http://localhost:5173"