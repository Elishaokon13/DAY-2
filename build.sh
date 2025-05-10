#!/bin/bash
echo "Building without ESLint..."
export NEXT_DISABLE_ESLINT=1
npm run build 