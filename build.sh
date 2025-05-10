#!/bin/bash

# Install dependencies with --no-optional to skip problematic native modules
npm install --no-optional

# Run the build
npm run build:prod 