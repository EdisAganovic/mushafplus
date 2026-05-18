#!/usr/bin/env node
/**
 * Update version for all cached files
 * Usage: node update-version.js [version]
 *        node update-version.js --help
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_UPDATE = [
  'index.html',
  'service-worker.js',
  'css/tailwind-output.css',
  'css/themes.css'
];

const CACHE_VERSION_PREFIX = 'v';

function updateVersion(filePath, version) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern for APP_VERSION constant
  const appVersionPattern = /const APP_VERSION\s*=\s*"([^"]+)"/;
  const cacheVersionPattern = /const CACHE_VERSION\s*=\s*"([^"]+)"/;
  
  // Pattern for document.write with ?v=
  const writePattern = /\?v=([^\s"'>]+)/g;

  let updated = false;

  // Update APP_VERSION constant
  if (appVersionPattern.test(content)) {
    content = content.replace(appVersionPattern, `const APP_VERSION = "${version}"`);
    updated = true;
    console.log(`✅ Updated APP_VERSION in ${filePath}`);
  }

  // Update CACHE_VERSION constant  
  if (cacheVersionPattern.test(content)) {
    const currentCacheVersion = cacheVersionPattern.exec(content)[1];
    let newCacheVersion = version;
    
    // Add cache version prefix if not present
    if (!newCacheVersion.startsWith(CACHE_VERSION_PREFIX)) {
      newCacheVersion = `${CACHE_VERSION_PREFIX}${version}`;
    }
    
    content = content.replace(cacheVersionPattern, `const CACHE_VERSION = "${newCacheVersion}"`);
    updated = true;
    console.log(`✅ Updated CACHE_VERSION in ${filePath}`);
  }

  // Update all ?v= parameters (except for service-worker.js which uses dynamic CACHE_VERSION)
  if (updated && !filePath.endsWith('service-worker.js')) {
    let matches = 0;
    content = content.replace(writePattern, (match, p1) => {
      matches++;
      return `?v=${version}`;
    });
    if (matches > 0) {
      console.log(`✅ Updated ${matches} ?v= parameters in ${filePath}`);
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Usage: node update-version.js [version]

Options:
  [version]  New version number (default: auto-increment)
  --help     Show this help message

Examples:
  node update-version.js 0.1.8
  node update-version.js v1.0.0
  
Auto-increment examples:
  node update-version.js   # Increments patch version (0.1.7 → 0.1.8)
`);
    process.exit(0);
  }

  // Auto-increment if no version provided
  let version = args[0];
  
  if (!version) {
    // Read current version from package.json
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const [major, minor, patch] = pkg.version.split('.').map(Number);
    version = `${major}.${minor}.${patch + 1}`;
    console.log(`ℹ️  No version specified, auto-incrementing to: ${version}`);
  }

  // Update all files
  let updatedFiles = 0;
  FILES_TO_UPDATE.forEach(file => {
    if (updateVersion(file, version)) {
      updatedFiles++;
    }
  });

  console.log(`\n✅ Updated ${updatedFiles}/${FILES_TO_UPDATE.length} files`);
  console.log(`📦 New version: ${version}`);
}

main();