#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Get version from argument or prompt
VERSION=$1
if [ -z "$VERSION" ]; then
  read -p "Enter version number (e.g. 1.0.0): " VERSION
fi

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Invalid version format. Please use semantic versioning (e.g. 1.0.0)${NC}"
  exit 1
fi

# Create releases directory if it doesn't exist
mkdir -p releases/$VERSION

# Generate changelog
echo -e "${GREEN}Generating changelog...${NC}"
./scripts/generate-changelog.sh $VERSION

# Create packages
echo -e "${GREEN}Creating packages...${NC}"
./scripts/package.sh $VERSION

# Create and push tag
echo -e "${GREEN}Creating tag v$VERSION...${NC}"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"

# Ensure the release files exist and are named correctly
cd releases/$VERSION
if [ ! -f "backend.tar.gz" ] || [ ! -f "agent.tar.gz" ]; then
  echo -e "${RED}Release files not found${NC}"
  exit 1
fi

# Rename the files
mv backend.tar.gz coresight-backend.tar.gz
mv agent.tar.gz coresight-agent.tar.gz

# Verify files exist after renaming
if [ ! -f "coresight-backend.tar.gz" ] || [ ! -f "coresight-agent.tar.gz" ]; then
  echo -e "${RED}Failed to rename release files${NC}"
  exit 1
fi

cd ../..

# Create GitHub release with changelog
echo -e "${GREEN}Creating GitHub release...${NC}"
gh release create "v$VERSION" \
  --title "CoreSight v$VERSION" \
  --notes-file "changelogs/v$VERSION.md" \
  "releases/$VERSION/coresight-backend.tar.gz" \
  "releases/$VERSION/coresight-agent.tar.gz"

# Update main changelog file
if [ ! -f CHANGELOG.md ]; then
  echo "# Changelog" > CHANGELOG.md
fi

cat "changelogs/v$VERSION.md" CHANGELOG.md > CHANGELOG.tmp
mv CHANGELOG.tmp CHANGELOG.md

# Commit changelog
git add CHANGELOG.md "changelogs/v$VERSION.md"
git commit -m "docs: update changelog for v$VERSION"
git push origin main

echo -e "${GREEN}Release v$VERSION created successfully!${NC}"
echo -e "Backend download URL: https://github.com/nexcodejimm/coresight/releases/download/v$VERSION/coresight-backend.tar.gz"
echo -e "Agent download URL: https://github.com/nexcodejimm/coresight/releases/download/v$VERSION/coresight-agent.tar.gz" 