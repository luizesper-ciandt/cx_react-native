#!/usr/bin/env node

/**
 * Bundle React Native for Android (Brownfield)
 *
 * Cross-platform script that works on Windows, macOS, and Linux.
 *
 * Usage:
 *   node scripts/bundle-android.js [--dev] [--skip-hermes]
 *
 * Options:
 *   --dev          Build development bundle (default: production)
 *   --skip-hermes  Skip Hermes bytecode compilation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const skipHermes = args.includes('--skip-hermes');

const rootDir = path.join(__dirname, '..');
const outputDir = path.join(rootDir, 'dist');
const bundleFile = path.join(outputDir, 'index.android.bundle');
const sourceMapFile = path.join(outputDir, 'index.android.bundle.map');

console.log('='.repeat(60));
console.log(`Bundling React Native for Android (${isDev ? 'development' : 'production'})`);
console.log('='.repeat(60));
console.log(`Output directory: ${outputDir}`);
console.log('');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
}

// Step 1: Run Metro bundler
console.log('\n[1/3] Running Metro bundler...');

const bundleArgs = [
    'react-native', 'bundle',
    '--platform', 'android',
    '--dev', isDev ? 'true' : 'false',
    '--entry-file', 'index.js',
    '--bundle-output', bundleFile,
    '--assets-dest', outputDir,
    '--sourcemap-output', sourceMapFile
];

if (!isDev) {
    bundleArgs.push('--minify', 'true');
}

console.log(`Running: npx ${bundleArgs.join(' ')}`);

const bundleResult = spawnSync('npx', bundleArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
});

if (bundleResult.status !== 0) {
    console.error('\nBundle failed!');
    process.exit(1);
}

console.log('Bundle created successfully!');

// Step 2: Compile to Hermes bytecode (production only)
if (!isDev && !skipHermes) {
    console.log('\n[2/3] Compiling to Hermes bytecode...');

    // Determine hermesc path based on platform
    const platform = process.platform;
    let hermescBin;

    if (platform === 'win32') {
        hermescBin = 'win64-bin/hermesc.exe';
    } else if (platform === 'darwin') {
        hermescBin = 'osx-bin/hermesc';
    } else {
        hermescBin = 'linux64-bin/hermesc';
    }

    const hermescPath = path.join(
        rootDir, 'node_modules', 'react-native',
        'sdks', 'hermesc', hermescBin
    );

    if (!fs.existsSync(hermescPath)) {
        console.error(`Hermes compiler not found at: ${hermescPath}`);
        console.log('Skipping Hermes compilation...');
    } else {
        const hermesArgs = [
            '-emit-binary',
            '-out', bundleFile,
            bundleFile
        ];

        console.log(`Running: ${hermescPath} ${hermesArgs.join(' ')}`);

        const hermesResult = spawnSync(hermescPath, hermesArgs, {
            cwd: rootDir,
            stdio: 'inherit',
            shell: platform === 'win32'
        });

        if (hermesResult.status !== 0) {
            console.error('Hermes compilation failed!');
            process.exit(1);
        }

        console.log('Hermes bytecode compilation successful!');
    }
} else {
    console.log('\n[2/3] Skipping Hermes compilation (dev mode or --skip-hermes)');
}

// Step 3: Generate metadata
console.log('\n[3/3] Generating metadata.json...');

try {
    execSync(`node "${path.join(__dirname, 'generate-metadata.js')}" "${path.join(outputDir, 'metadata.json')}"`, {
        cwd: rootDir,
        stdio: 'inherit'
    });
} catch (e) {
    console.error('Failed to generate metadata:', e.message);
    process.exit(1);
}

// Print summary
console.log('\n' + '='.repeat(60));
console.log('BUILD COMPLETE');
console.log('='.repeat(60));

if (fs.existsSync(bundleFile)) {
    const stats = fs.statSync(bundleFile);
    console.log(`Bundle: ${bundleFile}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

if (fs.existsSync(sourceMapFile)) {
    const stats = fs.statSync(sourceMapFile);
    console.log(`Source Map: ${sourceMapFile}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

const metadataFile = path.join(outputDir, 'metadata.json');
if (fs.existsSync(metadataFile)) {
    console.log(`Metadata: ${metadataFile}`);
}

console.log('\nBundle ready in dist/ folder!');
