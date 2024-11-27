#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

VERSION=$1
PREV_VERSION=$2

if [ -z "$VERSION" ]; then
    echo -e "${RED}Please provide a version number${NC}"
    exit 1
fi

if [ -z "$PREV_VERSION" ]; then
    PREV_VERSION=$(git describe --tags --abbrev=0)
fi

echo -e "${GREEN}Generating changelog for v$VERSION...${NC}"

# Create changelog directory if it doesn't exist
mkdir -p changelogs

# Generate changelog
echo "# Changelog for v$VERSION" > "changelogs/v$VERSION.md"
echo "" >> "changelogs/v$VERSION.md"
echo "## Changes" >> "changelogs/v$VERSION.md"
echo "" >> "changelogs/v$VERSION.md"

# Get commits since last version
git log "$PREV_VERSION..HEAD" --pretty=format:"* %s" | while read -r line; do
    # Skip merge commits
    if [[ ! $line == *"Merge"* ]]; then
        echo "$line" >> "changelogs/v$VERSION.md"
    fi
done

echo "" >> "changelogs/v$VERSION.md"
echo "## Components" >> "changelogs/v$VERSION.md"
echo "" >> "changelogs/v$VERSION.md"
echo "### Backend" >> "changelogs/v$VERSION.md"
git log "$PREV_VERSION..HEAD" --pretty=format:"* %s" -- backend/ | while read -r line; do
    if [[ ! $line == *"Merge"* ]]; then
        echo "$line" >> "changelogs/v$VERSION.md"
    fi
done

echo "" >> "changelogs/v$VERSION.md"
echo "### Agent" >> "changelogs/v$VERSION.md"
git log "$PREV_VERSION..HEAD" --pretty=format:"* %s" -- coresight-agent/ | while read -r line; do
    if [[ ! $line == *"Merge"* ]]; then
        echo "$line" >> "changelogs/v$VERSION.md"
    fi
done

echo -e "${GREEN}Changelog generated at changelogs/v$VERSION.md${NC}" 