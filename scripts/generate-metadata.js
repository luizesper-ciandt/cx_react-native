#!/usr/bin/env node

/**
 * Generate metadata.json for brownfield bundle
 *
 * Cross-platform script that works on Windows, macOS, and Linux.
 *
 * Usage:
 *   node scripts/generate-metadata.js [output-path]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get output path from args or use default
const outputPath = process.argv[2] || path.join(__dirname, '..', 'dist', 'metadata.json');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get git commit SHA
function getCommitSha() {
    try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.warn('Warning: Could not get git commit SHA');
        return 'unknown';
    }
}

// Get git branch
function getBranch() {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
        console.warn('Warning: Could not get git branch');
        return 'unknown';
    }
}

// Build metadata object
const metadata = {
    version: packageJson.version,
    name: packageJson.name,
    minAndroidVersion: packageJson.androidCompat?.minVersion || '1.0.0',
    commitSha: getCommitSha(),
    branch: getBranch(),
    buildDate: new Date().toISOString(),
    hermesEnabled: true,
    newArchEnabled: true,
    reactNativeVersion: packageJson.dependencies['react-native']
};

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write metadata file
fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf8');

console.log('Generated metadata.json:');
console.log(JSON.stringify(metadata, null, 2));
console.log(`\nOutput: ${outputPath}`);
