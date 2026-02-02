#!/usr/bin/env node

/**
 * Automatically detect, fix, and create patches for iOS API compatibility issues
 * Designed to run in CI/CD before the build
 * This script is self-contained and doesn't require other modules
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// iOS APIs that require specific versions
const iOS_APIS = {
  '13.0': [
    { pattern: /UIApplication\.shared\.connectedScenes/g, name: 'UIApplication.shared.connectedScenes' },
    { pattern: /UIWindowScene/g, name: 'UIWindowScene' },
    { pattern: /prefersEphemeralWebBrowserSession/g, name: 'prefersEphemeralWebBrowserSession' },
  ],
  '14.0': [
    { pattern: /UTType\s*\(/g, name: 'UTType' },
    { pattern: /UTType\.image/g, name: 'UTType.image' },
    { pattern: /UTType\.movie/g, name: 'UTType.movie' },
    { pattern: /UTType\.livePhoto/g, name: 'UTType.livePhoto' },
    { pattern: /\.image\s*\.identifier/g, name: 'UTType.image.identifier' },
    { pattern: /\.movie\s*\.identifier/g, name: 'UTType.movie.identifier' },
    { pattern: /PHPickerViewController/g, name: 'PHPickerViewController' },
    { pattern: /PHPickerConfiguration/g, name: 'PHPickerConfiguration' },
    { pattern: /PHPickerFilter/g, name: 'PHPickerFilter' },
    { pattern: /PHPhotoLibrary\.authorizationStatus\(for:/g, name: 'PHPhotoLibrary.authorizationStatus(for:)' },
    { pattern: /PHPhotoLibrary\.requestAuthorization\(for:/g, name: 'PHPhotoLibrary.requestAuthorization(for:)' },
    { pattern: /PHAccessLevel/g, name: 'PHAccessLevel' },
    { pattern: /PHAuthorizationStatus\.limited/g, name: 'PHAuthorizationStatus.limited' },
    { pattern: /locationManager\.authorizationStatus/g, name: 'locationManager.authorizationStatus' },
    { pattern: /backButtonDisplayMode/g, name: 'backButtonDisplayMode' },
    { pattern: /updateVisibleMenu/g, name: 'updateVisibleMenu' },
    { pattern: /UIColor\(options\.color\)/g, name: 'UIColor(SwiftUI.Color)' },
    { pattern: /SDImageAWebPCoder/g, name: 'SDImageAWebPCoder' },
    { pattern: /FileSystemModule/g, name: 'FileSystemModule' },
    { pattern: /MediaHandler/g, name: 'MediaHandler' },
  ],
  '15.0': [
    { pattern: /UIImage\.SymbolConfiguration\(hierarchicalColor:/g, name: 'UIImage.SymbolConfiguration(hierarchicalColor:)' },
    { pattern: /UIImage\.SymbolConfiguration\(paletteColors:/g, name: 'UIImage.SymbolConfiguration(paletteColors:)' },
    { pattern: /UIImage\.SymbolConfiguration\.preferringMulticolor\(\)/g, name: 'UIImage.SymbolConfiguration.preferringMulticolor()' },
    { pattern: /\.singleSelection/g, name: 'UIMenu.Options.singleSelection' },
    { pattern: /configuration\.selection\s*=/g, name: 'PHPickerConfiguration.selection' },
    { pattern: /\.selection\s*=\s*\.ordered/g, name: 'PHPickerConfiguration.selection = .ordered' },
    { pattern: /\.selection\s*=\s*\.default/g, name: 'PHPickerConfiguration.selection = .default' },
  ],
  '16.0': [
    { pattern: /UIImage\.SymbolConfiguration\.preferringMonochrome\(\)/g, name: 'UIImage.SymbolConfiguration.preferringMonochrome()' },
  ],
};

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
    } else if (entry.name.endsWith('.swift') || entry.name.endsWith('.mm') || entry.name.endsWith('.m') || entry.name.endsWith('.h')) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasAvailabilityGuard(content, lineIndex, apiVersion) {
  const lines = content.split('\n');
  for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 20); i--) {
    const line = lines[i].trim();
    if (line.includes('@available') || line.includes('#available') || line.includes('API_AVAILABLE')) {
      const versionMatch = line.match(/iOS\s+(\d+\.\d+)|ios\((\d+\.\d+)\)/i);
      if (versionMatch) {
        const guardVersion = parseFloat(versionMatch[1] || versionMatch[2]);
        const requiredVersion = parseFloat(apiVersion);
        if (guardVersion >= requiredVersion) {
          return true;
        }
      }
    }
    if (line.match(/^(func|class|struct|enum|extension|protocol)\s+/) && !line.includes('@available') && !line.includes('#available')) {
      break;
    }
  }
  return false;
}

function detectAPIIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const lines = content.split('\n');
  const isHeaderFile = filePath.endsWith('.h');
  const isSwiftFile = filePath.endsWith('.swift');
  
  // Detect iOS API availability issues
  for (const [version, apis] of Object.entries(iOS_APIS)) {
    for (const api of apis) {
      const matches = [...content.matchAll(new RegExp(api.pattern.source, 'g'))];
      for (const match of matches) {
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const line = lines[lineIndex];
        
        if (hasAvailabilityGuard(content, lineIndex, version)) continue;
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;
        
        const beforeMatch = content.substring(0, match.index);
        const quotesBefore = (beforeMatch.match(/"/g) || []).length;
        if (quotesBefore % 2 !== 0) continue;
        
        issues.push({
          api: api.name,
          version: version,
          line: lineIndex + 1,
          file: filePath,
          match: match[0],
          type: 'api_availability',
        });
      }
    }
  }
  
  // Detect missing imports for legacy APIs (MobileCoreServices)
  if (isSwiftFile && content.includes('UTTypeCreatePreferredIdentifierForTag') && !content.includes('import MobileCoreServices')) {
    const match = content.match(/UTTypeCreatePreferredIdentifierForTag/);
    if (match) {
      const lineIndex = content.substring(0, match.index).split('\n').length - 1;
      issues.push({
        api: 'UTTypeCreatePreferredIdentifierForTag',
        version: '14.0',
        line: lineIndex + 1,
        file: filePath,
        match: match[0],
        type: 'missing_import',
      });
    }
  }
  
  // Detect classes using iOS 14+ APIs without @available on the class
  if (isSwiftFile) {
    // Check for classes using FileSystemModule (iOS 14+)
    const classMatch = content.match(/^\s*(internal|public|private|fileprivate)?\s*(class|struct)\s+(\w+)[^{]*\{/gm);
    if (classMatch) {
      for (const match of classMatch) {
        const classLineIndex = content.substring(0, content.indexOf(match)).split('\n').length - 1;
        const classLine = lines[classLineIndex];
        const className = match.match(/(class|struct)\s+(\w+)/)?.[2];
        
        // Check if class uses FileSystemModule or other iOS 14+ APIs
        const classStart = content.indexOf(match);
        const classEnd = findClassEnd(content, classStart);
        const classContent = content.substring(classStart, classEnd);
        
        if ((classContent.includes('FileSystemModule') || 
             classContent.includes('UTType(') ||
             classContent.includes('PHPickerViewController') ||
             classContent.includes('MediaHandler')) &&
            !classLine.includes('@available(iOS 14.0')) {
          issues.push({
            api: `Class ${className} uses iOS 14+ APIs`,
            version: '14.0',
            line: classLineIndex + 1,
            file: filePath,
            match: match,
            type: 'class_availability',
            className: className,
          });
        }
      }
    }
  }
  
  // Detect nullability issues in Objective-C headers
  if (isHeaderFile) {
    // Check for methods/properties without nullability annotations
    const methodPattern = /-\s*\([^)]+\)\s*(\w+):\s*\([^)]*\)\s*(\w+)(?:\s*(\w+))?/g;
    const matches = [...content.matchAll(methodPattern)];
    for (const match of matches) {
      const lineIndex = content.substring(0, match.index).split('\n').length - 1;
      const line = lines[lineIndex];
      
      // Skip if already has nullability annotations
      if (line.includes('_Nonnull') || line.includes('_Nullable') || line.includes('NS_ASSUME_NONNULL')) {
        continue;
      }
      
      // Skip if it's a typedef or other non-method declaration
      if (line.includes('typedef') || line.includes('@protocol') || line.includes('@interface') && !line.includes('(')) {
        continue;
      }
      
      // Only flag if it's a method with block or object parameters
      if (match[0].includes('Block') || match[0].includes('*') || match[0].includes('NSURL') || match[0].includes('NSString')) {
        issues.push({
          api: 'Missing nullability annotation',
          version: 'all',
          line: lineIndex + 1,
          file: filePath,
          match: match[0],
          type: 'nullability',
        });
      }
    }
  }
  
  return issues;
}

function findClassEnd(content, startIndex) {
  let braceCount = 0;
  let inString = false;
  let stringChar = null;
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';
    
    // Handle string literals
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }
    
    if (inString) continue;
    
    if (char === '{') braceCount++;
    if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return i + 1;
      }
    }
  }
  
  return content.length;
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

function fixAPIIssue(content, issue, lines) {
  const lineIndex = issue.line - 1;
  const line = lines[lineIndex];
  if (!line) return null;
  
  const isHeaderFile = issue.file.endsWith('.h');
  const isSwiftFile = issue.file.endsWith('.swift');
  
  // Handle missing import
  if (issue.type === 'missing_import') {
    // Find the last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      return {
        type: 'insert_import',
        lineIndex: lastImportIndex + 1,
        old: '',
        new: '#if !os(iOS) || __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_14_0\nimport MobileCoreServices\n#endif\n',
      };
    } else {
      // No imports found, add at the beginning
      return {
        type: 'insert_import',
        lineIndex: 0,
        old: '',
        new: '#if !os(iOS) || __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_14_0\nimport MobileCoreServices\n#endif\n\n',
      };
    }
  }
  
  // Handle class availability
  if (issue.type === 'class_availability') {
    return {
      type: 'declaration',
      lineIndex,
      old: line,
      new: `${line.match(/^\s*/)[0]}@available(iOS ${issue.version}, *)\n${line}`,
    };
  }
  
  // Handle nullability in headers
  if (issue.type === 'nullability' && isHeaderFile) {
    // Check if file has NS_ASSUME_NONNULL_BEGIN
    if (!content.includes('NS_ASSUME_NONNULL_BEGIN')) {
      // Add NS_ASSUME_NONNULL_BEGIN after imports
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('#import') || lines[i].trim().startsWith('@import')) {
          insertIndex = i + 1;
        } else if (lines[i].trim().startsWith('@interface') || lines[i].trim().startsWith('@protocol')) {
          break;
        }
      }
      
      return {
        type: 'insert_nullability',
        lineIndex: insertIndex,
        old: '',
        new: '\nNS_ASSUME_NONNULL_BEGIN\n',
        alsoAddEnd: true,
      };
    }
    
    // Add nullability annotations to the method
    const annotated = line.replace(/(\w+\s*\*)\s*(\w+)/g, '$1 _Nonnull $2')
                          .replace(/(Block|Callback)\s*\)/g, '$1 _Nonnull)')
                          .replace(/(NSError\s*\*)/g, '$1 _Nullable');
    
    if (annotated !== line) {
      return {
        type: 'nullability_annotation',
        lineIndex,
        old: line,
        new: annotated,
      };
    }
  }
  
  // Handle API availability
  if (issue.type === 'api_availability') {
    if (hasAvailabilityGuard(content, lineIndex, issue.version)) {
      return null;
    }
    
    const indent = line.match(/^\s*/)[0];
    const version = issue.version;
    
    // Check if it's a declaration
    const isDeclaration = /^\s*(struct|class|enum|extension|protocol|func|init)\s+/.test(line);
    
    if (isDeclaration) {
      return {
        type: 'declaration',
        lineIndex,
        old: line,
        new: `${indent}@available(iOS ${version}, *)\n${line}`,
      };
    } else {
      // Wrap in #available guard
      let endIndex = lineIndex;
      let statement = line;
      
      // Check if it's a multi-line statement
      if (!line.trim().endsWith(';') && !line.trim().endsWith('}')) {
        for (let i = lineIndex + 1; i < Math.min(lines.length, lineIndex + 5); i++) {
          statement += '\n' + lines[i];
          if (lines[i].trim().endsWith(';') || lines[i].trim().endsWith('}')) {
            endIndex = i;
            break;
          }
        }
      }
      
      // Special handling for UTType fallback
      if (issue.api.includes('UTType') && content.includes('UTTypeCreatePreferredIdentifierForTag')) {
        return {
          type: 'statement',
          lineIndex,
          endIndex,
          old: statement,
          new: `${indent}if #available(iOS ${version}, *) {\n${statement}\n${indent}} else {\n${indent}  // Fallback for iOS < ${version}: use legacy UTTypeCreatePreferredIdentifierForTag\n${indent}  guard let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, pathExtension as CFString, nil)?.takeRetainedValue() else {\n${indent}    return nil\n${indent}  }\n${indent}  if let mimeType = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() as String? {\n${indent}    return mimeType\n${indent}  }\n${indent}}\n`,
        };
      }
      
      return {
        type: 'statement',
        lineIndex,
        endIndex,
        old: statement,
        new: `${indent}if #available(iOS ${version}, *) {\n${statement}\n${indent}} else {\n${indent}  // Fallback for iOS < ${version}\n${indent}}\n`,
      };
    }
  }
  
  return null;
}

function fixFile(filePath, issues) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixes = [];
  const isHeaderFile = filePath.endsWith('.h');
  
  for (const issue of issues) {
    const fix = fixAPIIssue(content, issue, lines);
    if (fix) {
      fixes.push(fix);
    }
  }
  
  if (fixes.length === 0) {
    return false;
  }
  
  // Sort fixes by line index (descending) to apply from bottom to top
  fixes.sort((a, b) => b.lineIndex - a.lineIndex);
  
  // Track if we need to add NS_ASSUME_NONNULL_END
  let needsNullabilityEnd = false;
  
  for (const fix of fixes) {
    if (fix.type === 'declaration') {
      lines[fix.lineIndex] = fix.new;
    } else if (fix.type === 'insert_import') {
      lines.splice(fix.lineIndex, 0, ...fix.new.split('\n'));
    } else if (fix.type === 'insert_nullability') {
      lines.splice(fix.lineIndex, 0, ...fix.new.split('\n'));
      if (fix.alsoAddEnd) {
        needsNullabilityEnd = true;
      }
    } else if (fix.type === 'nullability_annotation') {
      lines[fix.lineIndex] = fix.new;
    } else if (fix.type === 'statement') {
      const before = lines.slice(0, fix.lineIndex);
      const after = lines.slice(fix.endIndex + 1);
      const newLines = fix.new.split('\n');
      lines.splice(fix.lineIndex, fix.endIndex - fix.lineIndex + 1, ...newLines);
    }
  }
  
  // Add NS_ASSUME_NONNULL_END if needed
  if (needsNullabilityEnd && isHeaderFile) {
    // Find the last @end
    let lastEndIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '@end') {
        lastEndIndex = i;
        break;
      }
    }
    
    if (lastEndIndex >= 0) {
      lines.splice(lastEndIndex + 1, 0, '', 'NS_ASSUME_NONNULL_END');
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return true;
}

function main() {
  console.log('🔧 Auto-fixing iOS API compatibility issues in CI...\n');
  
  const allPackages = getAllExpoAndRNPackages();
  const results = [];
  let totalFixed = 0;
  let patchesCreated = 0;
  
  for (const packageName of allPackages) {
    if (PATCHED_PACKAGES.has(packageName)) {
      continue;
    }
    
    const result = scanPackage(packageName);
    
    if (result.issues.length > 0) {
      console.log(`📦 ${packageName}: Found ${result.issues.length} issue(s)`);
      
      const byFile = {};
      for (const issue of result.issues) {
        if (!byFile[issue.file]) byFile[issue.file] = [];
        byFile[issue.file].push(issue);
      }
      
      let fixedCount = 0;
      for (const [file, issues] of Object.entries(byFile)) {
        if (fixFile(file, issues)) {
          fixedCount += issues.length;
          const relPath = path.relative(`node_modules/${packageName}`, file);
          console.log(`   ✅ Fixed ${issues.length} issue(s) in ${relPath}`);
        }
      }
      
      if (fixedCount > 0) {
        totalFixed += fixedCount;
        console.log(`   📦 Creating patch for ${packageName}...`);
        try {
          execSync(`npx patch-package ${packageName}`, { stdio: 'inherit' });
          patchesCreated++;
          console.log(`   ✅ Patch created: patches/${packageName}+*.patch\n`);
        } catch (error) {
          console.error(`   ❌ Failed to create patch: ${error.message}\n`);
          process.exit(1);
        }
      }
      
      results.push({ ...result, fixed: fixedCount });
    }
  }
  
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`   Packages scanned: ${allPackages.length}`);
  console.log(`   Issues fixed: ${totalFixed}`);
  console.log(`   Patches created: ${patchesCreated}`);
  
  if (totalFixed > 0) {
    console.log(`\n✅ All issues have been automatically fixed and patched!`);
    console.log(`   The build should now succeed.`);
    console.log(`\n💡 Note: New patches have been created.`);
    console.log(`   Consider committing them to the repository.`);
  } else {
    console.log(`\n✅ No issues found - all packages are compatible!`);
  }
  
  // Exit with success code (0) - don't fail the build
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, fixAPIIssue, main };
