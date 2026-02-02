#!/usr/bin/env node

/**
 * Script to automatically fix simple iOS API availability issues
 * WARNING: Use with caution! Always review changes before committing.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple fixes that can be applied automatically
const AUTO_FIXES = [
  {
    name: 'Add @available to struct/class using UTType',
    pattern: /(@available\([^)]+\)\s*)?(struct|class)\s+(\w+).*\{[\s\S]*?UTType[^@]*?(?=\n\s*(struct|class|func|var|let|@available|#available|$))/g,
    fix: (match, available, type, name) => {
      if (available) return match; // Already has @available
      return `@available(iOS 14.0, *)\n${match}`;
    },
    test: (content) => content.includes('UTType') && !content.includes('@available(iOS 14.0, *)'),
  },
  {
    name: 'Wrap PHPickerViewController usage',
    pattern: /(let|var)\s+picker\s*=\s*PHPickerViewController\(/g,
    fix: (match) => {
      return `if #available(iOS 14.0, *) {\n      ${match}`;
    },
    test: (content) => content.includes('PHPickerViewController') && !content.includes('#available(iOS 14.0'),
  },
];

function findSwiftFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSwiftFiles(fullPath));
    } else if (entry.name.endsWith('.swift')) {
      files.push(fullPath);
    }
  }
  return files;
}

function applyAutoFixes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;
  
  // Check if file needs UTType guard
  if (content.includes('UTType') && !content.includes('@available(iOS 14.0') && !content.includes('#available(iOS 14.0')) {
    // Find struct/class definitions that use UTType
    const structClassPattern = /(@available\([^)]+\)\s*)?(struct|class)\s+(\w+)([^{]*\{)/g;
    let match;
    const replacements = [];
    
    while ((match = structClassPattern.exec(content)) !== null) {
      const start = match.index;
      const structName = match[3];
      const afterMatch = content.substring(start + match[0].length);
      
      // Check if this struct/class uses UTType
      const nextStruct = afterMatch.search(/(struct|class)\s+\w+/);
      const scope = nextStruct > 0 ? afterMatch.substring(0, nextStruct) : afterMatch;
      
      if (scope.includes('UTType') && !match[1]) {
        // Add @available before struct/class
        replacements.push({
          index: start,
          old: match[0],
          new: `@available(iOS 14.0, *)\n${match[0]}`,
        });
      }
    }
    
    // Apply replacements in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      content = content.substring(0, r.index) + r.new + content.substring(r.index + r.old.length);
      modified = true;
    }
  }
  
  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function scanAndFixPackage(packageName, dryRun = true) {
  const packagePath = path.join('node_modules', packageName);
  if (!fs.existsSync(packagePath)) {
    return { package: packageName, fixed: 0, skipped: true };
  }
  
  const iosPath = path.join(packagePath, 'ios');
  if (!fs.existsSync(iosPath)) {
    return { package: packageName, fixed: 0, skipped: true };
  }
  
  const swiftFiles = findSwiftFiles(iosPath);
  let fixedCount = 0;
  const fixedFiles = [];
  
  for (const file of swiftFiles) {
    if (applyAutoFixes(file)) {
      fixedCount++;
      fixedFiles.push(path.relative(packagePath, file));
    }
  }
  
  return {
    package: packageName,
    fixed: fixedCount,
    files: fixedFiles,
    skipped: false,
  };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const packages = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
  
  const PACKAGES_TO_CHECK = packages.length > 0 
    ? packages 
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
      ];
  
  console.log(`🔧 Auto-fixing iOS API availability issues...`);
  if (dryRun) {
    console.log(`   ⚠️  DRY RUN MODE - No files will be modified\n`);
  } else {
    console.log(`   ⚠️  LIVE MODE - Files will be modified!\n`);
  }
  
  const results = [];
  for (const packageName of PACKAGES_TO_CHECK) {
    console.log(`📦 Processing ${packageName}...`);
    const result = scanAndFixPackage(packageName, dryRun);
    results.push(result);
    
    if (result.fixed > 0) {
      console.log(`   ✅ Fixed ${result.fixed} file(s)`);
      if (result.files.length > 0) {
        result.files.slice(0, 5).forEach(file => {
          console.log(`      - ${file}`);
        });
        if (result.files.length > 5) {
          console.log(`      ... and ${result.files.length - 5} more`);
        }
      }
    } else if (!result.skipped) {
      console.log(`   ℹ️  No auto-fixable issues found`);
    }
  }
  
  const packagesFixed = results.filter(r => r.fixed > 0);
  
  if (packagesFixed.length === 0) {
    console.log(`\n✅ No packages needed auto-fixing!`);
    return;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Packages fixed: ${packagesFixed.length}`);
  console.log(`   Total files fixed: ${packagesFixed.reduce((sum, r) => sum + r.fixed, 0)}`);
  
  if (!dryRun) {
    console.log(`\n💡 Next steps:`);
    for (const result of packagesFixed) {
      console.log(`   npx patch-package ${result.package}`);
    }
  } else {
    console.log(`\n💡 Run without --dry-run to apply fixes`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanAndFixPackage, applyAutoFixes };

