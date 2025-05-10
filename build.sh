#!/bin/bash
echo "Building without ESLint and TypeScript type checking..."
export NEXT_DISABLE_ESLINT=1
export NEXT_TYPESCRIPT_CHECK=0
npm run build 