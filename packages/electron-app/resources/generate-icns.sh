#!/bin/bash
# Script to generate icon.icns from icon.iconset directory
# Requires: icnsutils (install with: sudo apt-get install icnsutils on Debian/Ubuntu)
# Or on macOS: iconutil -c icns icon.iconset

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONSET_DIR="${SCRIPT_DIR}/icon.iconset"
OUTPUT_FILE="${SCRIPT_DIR}/icon.icns"

if [ ! -d "$ICONSET_DIR" ]; then
    echo "Error: icon.iconset directory not found at $ICONSET_DIR"
    exit 1
fi

# Try icnsutil (Linux)
if command -v icnsutil &> /dev/null; then
    echo "Using icnsutil to generate .icns file..."
    icnsutil -c icns "$ICONSET_DIR" -o "$OUTPUT_FILE"
    if [ $? -eq 0 ]; then
        echo "Successfully created $OUTPUT_FILE"
        exit 0
    fi
fi

# Try iconutil (macOS)
if command -v iconutil &> /dev/null; then
    echo "Using iconutil to generate .icns file..."
    iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_FILE"
    if [ $? -eq 0 ]; then
        echo "Successfully created $OUTPUT_FILE"
        exit 0
    fi
fi

echo "Error: Neither icnsutil nor iconutil found."
echo "Please install icnsutils (sudo apt-get install icnsutils) or run this on macOS"
exit 1
