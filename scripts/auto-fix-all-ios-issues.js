#!/usr/bin/env node

/**
 * Automatically fix ALL iOS API availability issues found
 * This script scans, fixes, and creates patches automatically
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { scanPackage, detectAPIIssues, iOS_APIS } = require('./comprehensive-ios-scan');

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

function fixFile(filePath, issues) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  // Sort issues by line number (descending) to avoid offset issues
  const sortedIssues = [...issues].sort((a, b) => b.line - a.line);
  
  for (const issue of sortedIssues) {
    const lineIndex = issue.line - 1;
    const line = lines[lineIndex];
    
    if (!line) continue;
    
    // Skip if already has guard
    if (line.includes('@available') || line.includes('#available')) {
      continue;
    }
    
    // Check if it's a struct/class/enum/extension declaration
    const isDeclaration = /^\s*(struct|class|enum|extension|protocol)\s+/.test(line);
    
    if (isDeclaration) {
      // Add @available before declaration
      const indent = line.match(/^\s*/)[0];
      const newLine = `${indent}@available(iOS ${issue.version}, *)\n${line}`;
      lines[lineIndex] = newLine;
      modified = true;
    } else {
      // Wrap in #available guard
      const indent = line.match(/^\s*/)[0];
      const guardStart = `${indent}if #available(iOS ${issue.version}, *) {\n`;
      const guardEnd = `${indent}} else {\n${indent}  // Fallback for iOS < ${issue.version}\n${indent}}\n`;
      
      // Find the end of the statement (look for semicolon or closing brace)
      let endIndex = lineIndex;
      let braceCount = 0;
      let inString = false;
      
      for (let i = lineIndex; i < lines.length && i < lineIndex + 10; i++) {
        const currentLine = lines[i];
        for (const char of currentLine) {
          if (char === '"' && (i === 0 || currentLine[i - 1] !== '\\')) {
            inString = !inString;
          }
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (char === ';' && braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
        if (endIndex !== lineIndex) break;
      }
      
      // Simple approach: wrap the line
      lines[lineIndex] = guardStart + line + '\n' + guardEnd;
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return true;
  }
  
  return false;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const autoPatch = args.includes('--auto-patch');
  
  console.log('🔍 Comprehensive iOS API compatibility scan and auto-fix...\n');
  if (dryRun) {
    console.log('   ⚠️  DRY RUN MODE - No files will be modified\n');
  } else {
    console.log('   ⚠️  LIVE MODE - Files will be modified!\n');
  }
  
  const allPackages = getAllExpoAndRNPackages();
  const results = [];
  let totalFixed = 0;
  
  for (const packageName of allPackages) {
    if (PATCHED_PACKAGES.has(packageName)) {
      console.log(`⏭️  Skipping ${packageName} (already patched)`);
      continue;
    }
    
    console.log(`📦 Processing ${packageName}...`);
    const result = scanPackage(packageName);
    
    if (result.issues.length > 0) {
      console.log(`   ⚠️  Found ${result.issues.length} issue(s)`);
      
      // Group by file
      const byFile = {};
      for (const issue of result.issues) {
        if (!byFile[issue.file]) byFile[issue.file] = [];
        byFile[issue.file].push(issue);
      }
      
      let fixedCount = 0;
      for (const [file, issues] of Object.entries(byFile)) {
        if (!dryRun) {
          if (fixFile(file, issues)) {
            fixedCount += issues.length;
            const relPath = path.relative(`node_modules/${packageName}`, file);
            console.log(`      ✅ Fixed ${issues.length} issue(s) in ${relPath}`);
          }
        } else {
          const relPath = path.relative(`node_modules/${packageName}`, file);
          console.log(`      📄 ${relPath}: ${issues.length} issue(s) would be fixed`);
        }
      }
      
      if (fixedCount > 0 && !dryRun) {
        totalFixed += fixedCount;
        
        if (autoPatch) {
          console.log(`   📦 Creating patch for ${packageName}...`);
          try {
            execSync(`npx patch-package ${packageName}`, { stdio: 'inherit' });
            console.log(`   ✅ Patch created for ${packageName}`);
          } catch (error) {
            console.error(`   ❌ Failed to create patch for ${packageName}:`, error.message);
          }
        } else {
          console.log(`   💡 Run 'npx patch-package ${packageName}' to create patch`);
        }
      }
      
      results.push({ ...result, fixed: fixedCount });
    } else if (!result.skipped) {
      console.log(`   ✅ No issues found`);
    }
  }
  
  const packagesWithIssues = results.filter(r => r.issues.length > 0);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`   Packages scanned: ${allPackages.length}`);
  console.log(`   Packages with issues: ${packagesWithIssues.length}`);
  console.log(`   Total issues found: ${packagesWithIssues.reduce((sum, r) => sum + r.issues.length, 0)}`);
  if (!dryRun) {
    console.log(`   Total issues fixed: ${totalFixed}`);
  }
  
  if (packagesWithIssues.length > 0 && !dryRun && !autoPatch) {
    console.log(`\n💡 To auto-create patches, run with --auto-patch flag`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, main };

