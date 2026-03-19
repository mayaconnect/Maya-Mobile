/**
 * Fix react-native-svg nullability issues for Xcode 16+
 * Run after `pod install` and before xcodebuild.
 */
const fs = require('fs');
const path = require('path');

const PODS_DIR = path.join(__dirname, '..', 'ios', 'Pods');

if (!fs.existsSync(PODS_DIR)) {
  console.log('⚠️  No ios/Pods directory, skipping react-native-svg fix.');
  process.exit(0);
}

function findFiles(dir, ext) {
  let results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findFiles(full, ext));
      } else if (entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch (_) {}
  return results;
}

// Find RNSVG in Pods
const svgDir = path.join(PODS_DIR, 'RNSVG');
if (!fs.existsSync(svgDir)) {
  console.log('⚠️  RNSVG not found in Pods, skipping.');
  process.exit(0);
}

const fixes = [
  { from: /\(UIView \*\)view/g, to: '(UIView * _Nullable)view' },
  { from: /\(CALayer \*\)layer/g, to: '(CALayer * _Nullable)layer' },
];

let patchedCount = 0;
const files = [...findFiles(svgDir, '.m'), ...findFiles(svgDir, '.h')];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  for (const fix of fixes) {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(file, content);
    patchedCount++;
  }
}
console.log(`✅ react-native-svg: ${patchedCount} file(s) patched.`);
