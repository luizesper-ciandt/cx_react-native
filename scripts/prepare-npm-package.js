#!/usr/bin/env node

/**
 * Prepare npm package for publishing
 *
 * This script ensures dist/ folder has:
 * - package.json (for npm package)
 * - index.android.bundle (Hermes bytecode)
 * - metadata.json (version, compatibility info, etc.)
 *
 * Usage:
 *   node scripts/prepare-npm-package.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Source files in dist (already there from bundle:android)
const bundlePath = path.join(distDir, 'index.android.bundle');
const metadataPath = path.join(distDir, 'metadata.json');
const rootPackageJsonPath = path.join(rootDir, 'package.json');

// Read root package.json
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

console.log('Preparing npm package for publishing...\n');

// 1. Check if dist directory exists
if (!fs.existsSync(distDir)) {
    console.error('Error: dist/ directory not found!');
    console.error('   Run "npm run bundle:android" first.');
    process.exit(1);
}

// 2. Check if bundle exists
if (!fs.existsSync(bundlePath)) {
    console.error('Error: index.android.bundle not found in dist/!');
    console.error('   Run "npm run bundle:android" first.');
    process.exit(1);
}

// 3. Check if metadata exists
if (!fs.existsSync(metadataPath)) {
    console.error('Error: metadata.json not found in dist/!');
    console.error('   Run "npm run bundle:android" first.');
    process.exit(1);
}

// 4. Generate package.json for the npm package
const npmPackageJson = {
    name: 'rnapp-bundle',
    version: rootPackageJson.version,
    description: 'React Native bundle for Android brownfield integration',
    main: 'index.android.bundle',
    files: [
        'index.android.bundle',
        'metadata.json'
    ],
    keywords: [
        'react-native',
        'android',
        'brownfield',
        'bundle'
    ],
    author: rootPackageJson.author || '',
    license: rootPackageJson.license || 'UNLICENSED'
};

fs.writeFileSync(
    path.join(distDir, 'package.json'),
    JSON.stringify(npmPackageJson, null, 2),
    'utf8'
);
console.log('Generated package.json');

// 5. Summary
console.log('\nPackage contents:');
console.log(`   - package.json (name: ${npmPackageJson.name}, version: ${npmPackageJson.version})`);

const bundleStats = fs.statSync(bundlePath);
console.log(`   - index.android.bundle (${(bundleStats.size / 1024).toFixed(2)} KB)`);
console.log(`   - metadata.json`);

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
console.log('\nMetadata:');
console.log(`   - version: ${metadata.version}`);
console.log(`   - minAndroidVersion: ${metadata.minAndroidVersion}`);
console.log(`   - commitSha: ${metadata.commitSha}`);
console.log(`   - branch: ${metadata.branch}`);
console.log(`   - hermesEnabled: ${metadata.hermesEnabled}`);

console.log('\nPackage ready!');
console.log('   To test locally: use "file:../cx_react-native/dist" in cx_android/react-native/package.json');
console.log('   To publish: npm publish ./dist\n');
