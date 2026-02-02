#!/usr/bin/env node

/**
 * Comprehensive scan for ALL potential iOS API compatibility issues
 * This script is more aggressive and checks for common patterns
 */

const fs = require('fs');
const path = require('path');

// Extended list of iOS APIs that require specific versions
const iOS_APIS = {
  '13.0': [
    { pattern: /UIApplication\.shared\.connectedScenes/g, name: 'UIApplication.shared.connectedScenes' },
    { pattern: /UIWindowScene/g, name: 'UIWindowScene' },
    { pattern: /prefersEphemeralWebBrowserSession/g, name: 'prefersEphemeralWebBrowserSession' },
    { pattern: /UISheetPresentationController/g, name: 'UISheetPresentationController' },
    { pattern: /UISceneActivationState/g, name: 'UISceneActivationState' },
    { pattern: /UIWindowSceneDelegate/g, name: 'UIWindowSceneDelegate' },
  ],
  '14.0': [
    { pattern: /UTType\s*\(/g, name: 'UTType' },
    { pattern: /UTType\.image/g, name: 'UTType.image' },
    { pattern: /UTType\.movie/g, name: 'UTType.movie' },
    { pattern: /UTType\.livePhoto/g, name: 'UTType.livePhoto' },
    { pattern: /UTType\.folder/g, name: 'UTType.folder' },
    { pattern: /UTType\.item/g, name: 'UTType.item' },
    { pattern: /UTType\.audio/g, name: 'UTType.audio' },
    { pattern: /UTType\.text/g, name: 'UTType.text' },
    { pattern: /\.image\s*\.identifier/g, name: 'UTType.image.identifier' },
    { pattern: /\.movie\s*\.identifier/g, name: 'UTType.movie.identifier' },
    { pattern: /PHPickerViewController/g, name: 'PHPickerViewController' },
    { pattern: /PHPickerConfiguration/g, name: 'PHPickerConfiguration' },
    { pattern: /PHPickerFilter/g, name: 'PHPickerFilter' },
    { pattern: /PHPickerResult/g, name: 'PHPickerResult' },
    { pattern: /PHPhotoLibrary\.authorizationStatus\(for:/g, name: 'PHPhotoLibrary.authorizationStatus(for:)' },
    { pattern: /PHPhotoLibrary\.requestAuthorization\(for:/g, name: 'PHPhotoLibrary.requestAuthorization(for:)' },
    { pattern: /PHAccessLevel/g, name: 'PHAccessLevel' },
    { pattern: /PHAuthorizationStatus\.limited/g, name: 'PHAuthorizationStatus.limited' },
    { pattern: /locationManager\.authorizationStatus/g, name: 'locationManager.authorizationStatus' },
    { pattern: /backButtonDisplayMode/g, name: 'backButtonDisplayMode' },
    { pattern: /updateVisibleMenu/g, name: 'updateVisibleMenu' },
    { pattern: /UIColor\(options\.color\)/g, name: 'UIColor(SwiftUI.Color)' },
    { pattern: /SDImageAWebPCoder/g, name: 'SDImageAWebPCoder' },
    { pattern: /UISheetPresentationController/g, name: 'UISheetPresentationController' },
    { pattern: /\.detents/g, name: 'UISheetPresentationController.detents' },
    { pattern: /\.preferredCornerRadius/g, name: 'UISheetPresentationController.preferredCornerRadius' },
    { pattern: /\.prefersGrabberVisible/g, name: 'UISheetPresentationController.prefersGrabberVisible' },
    { pattern: /\.largestUndimmedDetentIdentifier/g, name: 'UISheetPresentationController.largestUndimmedDetentIdentifier' },
    { pattern: /UISheetPresentationControllerDetent/g, name: 'UISheetPresentationControllerDetent' },
  ],
  '15.0': [
    { pattern: /UIImage\.SymbolConfiguration\(hierarchicalColor:/g, name: 'UIImage.SymbolConfiguration(hierarchicalColor:)' },
    { pattern: /UIImage\.SymbolConfiguration\(paletteColors:/g, name: 'UIImage.SymbolConfiguration(paletteColors:)' },
    { pattern: /UIImage\.SymbolConfiguration\.preferringMulticolor\(\)/g, name: 'UIImage.SymbolConfiguration.preferringMulticolor()' },
    { pattern: /\.singleSelection/g, name: 'UIMenu.Options.singleSelection' },
    { pattern: /\.displayAsPalette/g, name: 'UIMenu.Options.displayAsPalette' },
    { pattern: /\.keepsMenuPresented/g, name: 'UIMenuElement.Attributes.keepsMenuPresented' },
    { pattern: /configuration\.selection\s*=/g, name: 'PHPickerConfiguration.selection' },
    { pattern: /\.selection\s*=\s*\.ordered/g, name: 'PHPickerConfiguration.selection = .ordered' },
    { pattern: /\.selection\s*=\s*\.default/g, name: 'PHPickerConfiguration.selection = .default' },
    { pattern: /UISheetPresentationControllerDetent\.custom/g, name: 'UISheetPresentationControllerDetent.custom' },
    { pattern: /UISheetPresentationControllerDetent\.large/g, name: 'UISheetPresentationControllerDetent.large' },
    { pattern: /UISheetPresentationControllerDetent\.medium/g, name: 'UISheetPresentationControllerDetent.medium' },
  ],
  '16.0': [
    { pattern: /UIImage\.SymbolConfiguration\.preferringMonochrome\(\)/g, name: 'UIImage.SymbolConfiguration.preferringMonochrome()' },
  ],
};

function findSwiftFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
      files.push(...findSwiftFiles(fullPath));
    } else if (entry.name.endsWith('.swift') || entry.name.endsWith('.mm') || entry.name.endsWith('.m')) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasAvailabilityGuard(content, lineIndex, apiVersion) {
  const lines = content.split('\n');
  // Check 20 lines before
  for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 20); i--) {
    const line = lines[i].trim();
    // Check for @available or #available with the right version
    if (line.includes('@available') || line.includes('#available')) {
      // Extract version from guard
      const versionMatch = line.match(/iOS\s+(\d+\.\d+)/);
      if (versionMatch) {
        const guardVersion = parseFloat(versionMatch[1]);
        const requiredVersion = parseFloat(apiVersion);
        if (guardVersion >= requiredVersion) {
          return true;
        }
      }
    }
    // Stop if we hit a function/class/struct declaration
    if (line.match(/^(func|class|struct|enum|extension|protocol|@available|#available)\s+/)) {
      if (line.includes('@available') || line.includes('#available')) {
        continue; // Allow @available on declarations
      }
      break;
    }
  }
  return false;
}

function detectAPIIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const lines = content.split('\n');
  
  // Check for each iOS version
  for (const [version, apis] of Object.entries(iOS_APIS)) {
    for (const api of apis) {
      const matches = [...content.matchAll(new RegExp(api.pattern.source, 'g'))];
      for (const match of matches) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const line = lines[lineIndex];
        
        // Skip if already in a guard
        if (hasAvailabilityGuard(content, lineIndex, version)) {
          continue;
        }
        
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
          continue;
        }
        
        // Skip if in a string literal
        const beforeMatch = content.substring(0, match.index);
        const quotesBefore = (beforeMatch.match(/"/g) || []).length;
        if (quotesBefore % 2 !== 0) {
          continue; // Inside a string
        }
        
        issues.push({
          api: api.name,
          version: version,
          line: lineIndex + 1,
          file: filePath,
          match: match[0],
          context: line.trim().substring(0, 100),
        });
      }
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
    filesScanned: swiftFiles.length,
  };
}

function getAllExpoAndRNPackages() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(allDeps)
      .filter(pkg => pkg.startsWith('expo-') || pkg.startsWith('react-native-') || pkg === 'expo')
      .sort();
  } catch (error) {
    return [];
  }
}

function main() {
  console.log('🔍 Comprehensive iOS API compatibility scan...\n');
  
  const allPackages = getAllExpoAndRNPackages();
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
  
  const results = [];
  let totalIssues = 0;
  
  for (const packageName of allPackages) {
    if (PATCHED_PACKAGES.has(packageName)) {
      console.log(`⏭️  Skipping ${packageName} (already patched)`);
      continue;
    }
    
    console.log(`📦 Scanning ${packageName}...`);
    const result = scanPackage(packageName);
    results.push(result);
    
    if (result.issues.length > 0) {
      totalIssues += result.issues.length;
      console.log(`   ⚠️  Found ${result.issues.length} potential issue(s) in ${result.filesScanned} file(s)`);
      
      // Group by API version
      const byVersion = {};
      for (const issue of result.issues) {
        const key = `iOS ${issue.version}+`;
        if (!byVersion[key]) byVersion[key] = [];
        byVersion[key].push(issue);
      }
      
      for (const [version, issues] of Object.entries(byVersion)) {
        console.log(`      ${version}: ${issues.length} occurrence(s)`);
        // Show first 3 examples
        issues.slice(0, 3).forEach(issue => {
          const relPath = path.relative(`node_modules/${packageName}`, issue.file);
          console.log(`         - ${relPath}:${issue.line} - ${issue.api}`);
        });
        if (issues.length > 3) {
          console.log(`         ... and ${issues.length - 3} more`);
        }
      }
    } else if (!result.skipped) {
      console.log(`   ✅ No issues found (${result.filesScanned} files scanned)`);
    }
  }
  
  const packagesWithIssues = results.filter(r => r.issues.length > 0);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`   Packages scanned: ${allPackages.length}`);
  console.log(`   Packages with issues: ${packagesWithIssues.length}`);
  console.log(`   Total issues found: ${totalIssues}`);
  
  if (packagesWithIssues.length > 0) {
    console.log(`\n⚠️  Packages needing attention:\n`);
    for (const result of packagesWithIssues) {
      console.log(`   📦 ${result.package}`);
      console.log(`      ${result.issues.length} issue(s) in ${result.filesScanned} file(s)`);
      
      // Group by file
      const byFile = {};
      for (const issue of result.issues) {
        const relPath = path.relative(`node_modules/${result.package}`, issue.file);
        if (!byFile[relPath]) byFile[relPath] = [];
        byFile[relPath].push(issue);
      }
      
      for (const [file, issues] of Object.entries(byFile)) {
        console.log(`      📄 ${file}: ${issues.length} issue(s)`);
      }
      console.log();
    }
    
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review the issues above`);
    console.log(`   2. Fix them manually in node_modules/<package>/ios/`);
    console.log(`   3. Create patches: npx patch-package <package-name>`);
    console.log(`   4. Add to PATCHED_PACKAGES in scripts`);
  } else {
    console.log(`\n✅ All packages are compatible!`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanPackage, detectAPIIssues, iOS_APIS };

