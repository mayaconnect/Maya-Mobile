/**
 * Fix react-native-maps nullability issues for Xcode 16+
 * Run after `pod install` and before xcodebuild.
 */
const fs = require('fs');
const path = require('path');

const PODS_DIR = path.join(__dirname, '..', 'ios', 'Pods');

if (!fs.existsSync(PODS_DIR)) {
  console.log('⚠️  No ios/Pods directory, skipping react-native-maps fix.');
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

// Find react-native-maps in Pods
const mapsDir = path.join(PODS_DIR, 'react-native-maps');
if (!fs.existsSync(mapsDir)) {
  console.log('⚠️  react-native-maps not found in Pods, skipping.');
  process.exit(0);
}

const fixes = [
  // MKMapViewDelegate methods
  { from: /\(MKAnnotationView \*\)annotationView/g, to: '(MKAnnotationView * _Nullable)annotationView' },
  { from: /\(MKOverlayRenderer \*\)renderer/g, to: '(MKOverlayRenderer * _Nullable)renderer' },
  { from: /\(MKAnnotation\)annotation(?!\s*_)/g, to: '(MKAnnotation _Nullable)annotation' },
];

let patchedCount = 0;
const files = [...findFiles(mapsDir, '.m'), ...findFiles(mapsDir, '.h')];

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
console.log(`✅ react-native-maps: ${patchedCount} file(s) patched.`);
