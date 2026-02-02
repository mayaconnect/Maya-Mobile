#!/usr/bin/env node

/**
 * Script to automatically fix iOS API availability issues in node_modules
 * Scans Swift files for iOS 14+ APIs without @available guards and adds them
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// APIs that require iOS 14.0+
const iOS14APIs = [
  // UTType
  { pattern: /UTType\s*\(/g, name: 'UTType', version: '14.0' },
  { pattern: /\.image\s*\.identifier/g, name: 'UTType.image.identifier', version: '14.0' },
  { pattern: /\.movie\s*\.identifier/g, name: 'UTType.movie.identifier', version: '14.0' },
  { pattern: /UTType\.image/g, name: 'UTType.image', version: '14.0' },
  { pattern: /UTType\.movie/g, name: 'UTType.movie', version: '14.0' },
  { pattern: /UTType\.livePhoto/g, name: 'UTType.livePhoto', version: '14.0' },
  { pattern: /UTType\.folder/g, name: 'UTType.folder', version: '14.0' },
  { pattern: /UTType\.item/g, name: 'UTType.item', version: '14.0' },
  { pattern: /UTType\.audio/g, name: 'UTType.audio', version: '14.0' },
  { pattern: /UTType\.text/g, name: 'UTType.text', version: '14.0' },
  
  // PHPicker
  { pattern: /PHPickerViewController/g, name: 'PHPickerViewController', version: '14.0' },
  { pattern: /PHPickerConfiguration/g, name: 'PHPickerConfiguration', version: '14.0' },
  { pattern: /PHPickerFilter/g, name: 'PHPickerFilter', version: '14.0' },
  { pattern: /PHPickerResult/g, name: 'PHPickerResult', version: '14.0' },
  
  // Photo Library iOS 14+
  { pattern: /PHPhotoLibrary\.authorizationStatus\(for:/g, name: 'PHPhotoLibrary.authorizationStatus(for:)', version: '14.0' },
  { pattern: /PHPhotoLibrary\.requestAuthorization\(for:/g, name: 'PHPhotoLibrary.requestAuthorization(for:)', version: '14.0' },
  { pattern: /PHAccessLevel/g, name: 'PHAccessLevel', version: '14.0' },
  { pattern: /PHAuthorizationStatus\.limited/g, name: 'PHAuthorizationStatus.limited', version: '14.0' },
  
  // Location iOS 14+
  { pattern: /locationManager\.authorizationStatus/g, name: 'locationManager.authorizationStatus', version: '14.0' },
  
  // Navigation iOS 14+
  { pattern: /backButtonDisplayMode/g, name: 'backButtonDisplayMode', version: '14.0' },
  { pattern: /updateVisibleMenu/g, name: 'updateVisibleMenu', version: '14.0' },
  
  // SwiftUI Color to UIColor iOS 14+
  { pattern: /UIColor\(options\.color\)/g, name: 'UIColor(SwiftUI.Color)', version: '14.0' },
];

// APIs that require iOS 15.0+
const iOS15APIs = [
  { pattern: /UIImage\.SymbolConfiguration\(hierarchicalColor:/g, name: 'UIImage.SymbolConfiguration(hierarchicalColor:)', version: '15.0' },
  { pattern: /UIImage\.SymbolConfiguration\(paletteColors:/g, name: 'UIImage.SymbolConfiguration(paletteColors:)', version: '15.0' },
  { pattern: /UIImage\.SymbolConfiguration\.preferringMulticolor\(\)/g, name: 'UIImage.SymbolConfiguration.preferringMulticolor()', version: '15.0' },
  { pattern: /\.singleSelection/g, name: 'UIMenu.Options.singleSelection', version: '15.0' },
  { pattern: /\.displayAsPalette/g, name: 'UIMenu.Options.displayAsPalette', version: '15.0' },
  { pattern: /\.keepsMenuPresented/g, name: 'UIMenuElement.Attributes.keepsMenuPresented', version: '15.0' },
];

// APIs that require iOS 16.0+
const iOS16APIs = [
  { pattern: /UIImage\.SymbolConfiguration\.preferringMonochrome\(\)/g, name: 'UIImage.SymbolConfiguration.preferringMonochrome()', version: '16.0' },
];

// APIs that require iOS 13.0+
const iOS13APIs = [
  { pattern: /UIApplication\.shared\.connectedScenes/g, name: 'UIApplication.shared.connectedScenes', version: '13.0' },
  { pattern: /UIWindowScene/g, name: 'UIWindowScene', version: '13.0' },
  { pattern: /prefersEphemeralWebBrowserSession/g, name: 'prefersEphemeralWebBrowserSession', version: '13.0' },
];

// Auto-detect all expo-* and react-native-* packages from package.json
function getAllExpoAndRNPackages() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(allDeps)
      .filter(pkg => pkg.startsWith('expo-') || pkg.startsWith('react-native-') || pkg === 'expo')
      .sort();
  } catch (error) {
    console.warn('⚠️  Could not read package.json, using default list');
    return [];
  }
}

// Packages to check (only Expo/React Native packages that commonly have issues)
const PACKAGES_TO_CHECK = getAllExpoAndRNPackages().length > 0 
  ? getAllExpoAndRNPackages()
  : [
      'expo-image-picker',
      'expo-image',
      'expo-font',
      'expo-symbols',
      'expo-maps',
      'expo-router',
      'expo-camera',
      'expo-print',
      'expo-web-browser',
      'expo-file-system',
      'react-native-screens',
    ];

// Packages that already have patches (skip them)
const PATCHED_PACKAGES = new Set([
  'expo-image-picker',
  'expo-image',
  'expo-font',
  'expo-symbols',
  'expo-maps',
  'expo-router',
  'expo-camera',
  'expo-print',
  'expo-web-browser',
  'expo-file-system',
  'react-native-screens',
]);

function findSwiftFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSwiftFiles(fullPath));
    } else if (entry.name.endsWith('.swift') || entry.name.endsWith('.mm')) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasAvailabilityGuard(content, lineIndex) {
  // Check if there's an @available or #available guard before this line
  const lines = content.split('\n');
  for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 10); i--) {
    const line = lines[i].trim();
    if (line.includes('@available') || line.includes('#available')) {
      return true;
    }
    // Stop if we hit a function/class/struct declaration
    if (line.match(/^(func|class|struct|enum|extension|protocol)\s+/)) {
      break;
    }
  }
  return false;
}

function detectAPIIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const lines = content.split('\n');
  
  // Skip if file already has availability checks
  if (content.includes('@available') || content.includes('#available')) {
    // Still check for unprotected APIs
  }
  
  // Check for iOS 14+ APIs
  for (const api of [...iOS14APIs, ...iOS15APIs, ...iOS16APIs, ...iOS13APIs]) {
    const matches = [...content.matchAll(new RegExp(api.pattern.source, 'g'))];
    for (const match of matches) {
      const lineIndex = content.substring(0, match.index).split('\n').length - 1;
      const line = lines[lineIndex];
      
      // Skip if already in a guard
      if (hasAvailabilityGuard(content, lineIndex)) {
        continue;
      }
      
      // Skip comments
      if (line.trim().startsWith('//')) {
        continue;
      }
      
      issues.push({
        api: api.name,
        version: api.version,
        line: lineIndex + 1,
        file: filePath,
        match: match[0],
      });
    }
  }
  
  return issues;
}

function scanPackage(packageName) {
  const packagePath = path.join('node_modules', packageName);
  if (!fs.existsSync(packagePath)) {
    return { package: packageName, issues: [], skipped: true };
  }
  
  const iosPath = path.join(packagePath, 'ios');
  if (!fs.existsSync(iosPath)) {
    return { package: packageName, issues: [], skipped: true };
  }
  
  const swiftFiles = findSwiftFiles(iosPath);
  const allIssues = [];
  
  for (const file of swiftFiles) {
    const issues = detectAPIIssues(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
  }
  
  return {
    package: packageName,
    issues: allIssues,
    skipped: false,
  };
}

function main() {
  console.log('🔍 Scanning packages for iOS API availability issues...\n');
  
  const results = [];
  for (const packageName of PACKAGES_TO_CHECK) {
    if (PATCHED_PACKAGES.has(packageName)) {
      console.log(`⏭️  Skipping ${packageName} (already patched)`);
      continue;
    }
    
    console.log(`📦 Checking ${packageName}...`);
    const result = scanPackage(packageName);
    results.push(result);
    
    if (result.issues.length > 0) {
      console.log(`   ⚠️  Found ${result.issues.length} potential issues`);
      // Group by API
      const byAPI = {};
      for (const issue of result.issues) {
        const key = `${issue.api} (iOS ${issue.version}+)`;
        if (!byAPI[key]) byAPI[key] = [];
        byAPI[key].push(issue);
      }
      for (const [api, issues] of Object.entries(byAPI)) {
        console.log(`      - ${api}: ${issues.length} occurrences`);
      }
    } else if (!result.skipped) {
      console.log(`   ✅ No issues found`);
    }
  }
  
  const packagesWithIssues = results.filter(r => r.issues.length > 0);
  
  if (packagesWithIssues.length === 0) {
    console.log('\n✅ No packages need patching!');
    return;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Packages with issues: ${packagesWithIssues.length}`);
  console.log(`   Total issues found: ${packagesWithIssues.reduce((sum, r) => sum + r.issues.length, 0)}`);
  
  console.log(`\n💡 Note: This script only detects issues.`);
  console.log(`   Manual patching is still required for complex cases.`);
  console.log(`   Use 'npx patch-package <package-name>' after making fixes.`);
}

if (require.main === module) {
  main();
}

module.exports = { scanPackage, detectAPIIssues, iOS14APIs, iOS15APIs, iOS16APIs, iOS13APIs };

