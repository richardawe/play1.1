#!/bin/bash

# GitHub Actions Setup Script for Play
# This script helps set up the repository for GitHub Actions

echo "🚀 Setting up GitHub Actions for Play..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this from the project root."
    exit 1
fi

# Check if GitHub Actions directory exists
if [ ! -d ".github/workflows" ]; then
    echo "📁 Creating .github/workflows directory..."
    mkdir -p .github/workflows
fi

echo "✅ GitHub Actions setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push these files:"
echo "   git add .github/"
echo "   git commit -m 'Add GitHub Actions for multi-platform builds'"
echo "   git push origin main"
echo ""
echo "2. Go to your GitHub repository"
echo "3. Check the Actions tab to see the workflows"
echo "4. Push to main branch to trigger a build"
echo ""
echo "🎯 To create a release:"
echo "   git tag v1.0.0"
echo "   git push origin v1.0.0"
echo ""
echo "📦 Build artifacts will be available in:"
echo "   - Actions tab (for all builds)"
echo "   - Releases page (for tagged releases)"
