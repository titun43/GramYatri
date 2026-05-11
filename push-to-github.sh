#!/bin/bash
# ============================================
# 🛺 GramYatri - GitHub Push Script
# ============================================
# এই স্ক্ৰিপ্ট আপোনাৰ ক'ড GitHub ত push কৰিব
# Run this after extracting the ZIP file
# ============================================

echo "🛺 GramYatri - GitHub Push আৰম্ভ কৰা হৈছে..."
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git ইনষ্টল নাই! প্ৰথমে Git ইনষ্টল কৰক:"
    echo "   Windows: https://git-scm.com/download/win"
    echo "   Mac: brew install git"
    echo "   Linux: sudo apt install git"
    exit 1
fi

echo "✅ Git পোৱা গ'ল"

# Initialize git if not already
if [ ! -d ".git" ]; then
    echo "📦 Git repository আৰম্ভ কৰা হৈছে..."
    git init
    git branch -M main
fi

# Add all files
echo "📁 সকলো ফাইল যোগ কৰা হৈছে..."
git add .

# Commit
echo "💾 Commit কৰা হৈছে..."
git commit -m "🛺 GramYatri - Ride Hailing App for Assam Villages"

# Add remote
echo "🔗 GitHub ৰ সৈতে সংযোগ কৰা হৈছে..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/titun43/GramYatri.git

# Push
echo "🚀 ক'ড GitHub ত push কৰা হৈছে..."
echo ""
echo "⚠️  যদি GitHub লগইন মাগে, আপোনাৰ GitHub username আৰু Personal Access Token দিয়ক"
echo "   Personal Access Token তৈয়াৰ কৰক: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉🎉🎉 সফলভাৱে push হ'ল! 🎉🎉🎉"
    echo ""
    echo "✅ আপোনাৰ ক'ড এতিয়া ইয়াত আছে:"
    echo "   https://github.com/titun43/GramYatri"
    echo ""
    echo "🚀 পৰৱৰ্তী পদক্ষেপ: Vercel ত ডিপ্লয় কৰক"
    echo "   https://vercel.com/new"
    echo ""
else
    echo ""
    echo "❌ Push ব্যৰ্থ হ'ল। এইবোৰ চেক কৰক:"
    echo "   1. GitHub ত লগইন কৰা আছে নেকি?"
    echo "   2. Personal Access Token আছে নেকি?"
    echo "   3. Internet connection আছে নেকি?"
    echo ""
    echo "💡 পুনৰ চেষ্টা কৰক: git push -u origin main"
fi
