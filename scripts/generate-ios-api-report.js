#!/usr/bin/env node

/**
 * Generate a detailed report of iOS API availability issues
 * Can be used in CI/CD to fail builds if issues are found
 */

const { scanPackage, detectAPIIssues } = require('./fix-ios-api-availability');
const fs = require('fs');
const path = require('path');

const PACKAGES_TO_CHECK = [
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

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    packages: [],
    summary: {
      total: 0,
      withIssues: 0,
      totalIssues: 0,
      byVersion: {
        'iOS 13.0+': 0,
        'iOS 14.0+': 0,
        'iOS 15.0+': 0,
        'iOS 16.0+': 0,
      },
    },
  };

  for (const packageName of PACKAGES_TO_CHECK) {
    if (PATCHED_PACKAGES.has(packageName)) {
      report.packages.push({
        name: packageName,
        status: 'patched',
        issues: [],
      });
      continue;
    }

    const result = scanPackage(packageName);
    report.packages.push(result);
    report.summary.total++;

    if (result.issues.length > 0) {
      report.summary.withIssues++;
      report.summary.totalIssues += result.issues.length;

      // Group by iOS version
      for (const issue of result.issues) {
        const version = issue.version;
        if (version === '13.0') report.summary.byVersion['iOS 13.0+']++;
        else if (version === '14.0') report.summary.byVersion['iOS 14.0+']++;
        else if (version === '15.0') report.summary.byVersion['iOS 15.0+']++;
        else if (version === '16.0') report.summary.byVersion['iOS 16.0+']++;
      }
    }
  }

  return report;
}

function formatReport(report, format = 'text') {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  let output = `\n📋 iOS API Availability Report\n`;
  output += `Generated: ${new Date(report.timestamp).toLocaleString()}\n`;
  output += `\n${'='.repeat(60)}\n\n`;

  output += `Summary:\n`;
  output += `  Total packages checked: ${report.summary.total}\n`;
  output += `  Packages with issues: ${report.summary.withIssues}\n`;
  output += `  Total issues found: ${report.summary.totalIssues}\n`;
  output += `\n  Issues by iOS version:\n`;
  for (const [version, count] of Object.entries(report.summary.byVersion)) {
    if (count > 0) {
      output += `    ${version}: ${count}\n`;
    }
  }

  if (report.summary.withIssues > 0) {
    output += `\n${'='.repeat(60)}\n\n`;
    output += `Packages with issues:\n\n`;

    for (const pkg of report.packages) {
      if (pkg.issues.length === 0) continue;

      output += `📦 ${pkg.package}\n`;
      output += `   ${pkg.issues.length} issue(s) found\n\n`;

      // Group by file
      const byFile = {};
      for (const issue of pkg.issues) {
        const relPath = path.relative(`node_modules/${pkg.package}`, issue.file);
        if (!byFile[relPath]) byFile[relPath] = [];
        byFile[relPath].push(issue);
      }

      for (const [file, issues] of Object.entries(byFile)) {
        output += `   📄 ${file}\n`;
        for (const issue of issues) {
          output += `      Line ${issue.line}: ${issue.api} (iOS ${issue.version}+)\n`;
        }
        output += `\n`;
      }
    }
  } else {
    output += `\n✅ All checked packages are compatible!\n`;
  }

  return output;
}

function main() {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : 'text';
  const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

  const report = generateReport();
  const formatted = formatReport(report, format);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted, 'utf8');
    console.log(`📄 Report written to ${outputFile}`);
  } else {
    console.log(formatted);
  }

  // Exit with error code if issues found (useful for CI)
  if (report.summary.totalIssues > 0 && args.includes('--fail-on-issues')) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateReport, formatReport };

