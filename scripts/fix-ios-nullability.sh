#!/bin/bash
# ==============================================
# Fix iOS nullability warnings for React Native
# ==============================================
# Some RN libraries use nullable types in a way
# that triggers Xcode 16+ strict nullability.
# This script patches generated headers/source
# to suppress those warnings.

set -euo pipefail

echo "🔧 Fixing iOS nullability issues..."

IOS_DIR="ios"

if [ ! -d "$IOS_DIR" ]; then
  echo "⚠️ No ios/ directory found, skipping nullability fixes."
  exit 0
fi

# ---------- 1. Suppress nullability warnings in Pods ----------
PODS_DIR="$IOS_DIR/Pods"
if [ -d "$PODS_DIR" ]; then
  echo "  → Patching Pods for nullability..."
  # Find all .h and .m files in Pods that have nullable issues
  find "$PODS_DIR" -name "*.h" -o -name "*.m" | while read -r file; do
    # Add NS_ASSUME_NONNULL_BEGIN/END pragma if file has sendable warnings
    if grep -q "Sendable" "$file" 2>/dev/null; then
      # Suppress sendable-related warnings
      if ! grep -q "pragma clang diagnostic ignored" "$file" 2>/dev/null; then
        sed -i '' '1s/^/#pragma clang diagnostic push\n#pragma clang diagnostic ignored "-Wnullability-completeness"\n#pragma clang diagnostic ignored "-Wprotocol"\n/' "$file" 2>/dev/null || true
      fi
    fi
  done
  echo "  ✅ Pods patched"
else
  echo "  ⚠️ No Pods directory, skipping Pods patches"
fi

# ---------- 2. Fix RCT* headers with nullable pointer issues ----------
find "$IOS_DIR" -name "RCT*.h" -path "*/React/*" 2>/dev/null | while read -r file; do
  # Suppress nullable-to-nonnull conversion warnings
  if grep -q "nullable" "$file" 2>/dev/null; then
    if ! grep -q "pragma clang diagnostic ignored.*-Wnullability" "$file" 2>/dev/null; then
      sed -i '' '1s/^/#pragma clang diagnostic push\n#pragma clang diagnostic ignored "-Wnullability-completeness"\n/' "$file" 2>/dev/null || true
    fi
  fi
done

# ---------- 3. Fix react-native-maps nullable issues ----------
MAPS_DIR=$(find "$IOS_DIR" -type d -name "react-native-maps" 2>/dev/null | head -1)
if [ -n "$MAPS_DIR" ] && [ -d "$MAPS_DIR" ]; then
  echo "  → Patching react-native-maps..."
  find "$MAPS_DIR" -name "*.m" -o -name "*.h" | while read -r file; do
    sed -i '' 's/\(MKAnnotationView \*\)annotationView/\(MKAnnotationView * _Nullable\)annotationView/g' "$file" 2>/dev/null || true
    sed -i '' 's/\(MKOverlayRenderer \*\)renderer/\(MKOverlayRenderer * _Nullable\)renderer/g' "$file" 2>/dev/null || true
  done
  echo "  ✅ react-native-maps patched"
fi

# ---------- 4. Fix react-native-svg nullable issues ----------
SVG_DIR=$(find "$IOS_DIR" -type d -name "RNSVG" 2>/dev/null | head -1)
if [ -n "$SVG_DIR" ] && [ -d "$SVG_DIR" ]; then
  echo "  → Patching react-native-svg..."
  find "$SVG_DIR" -name "*.m" -o -name "*.h" | while read -r file; do
    sed -i '' 's/\(UIView \*\)view/\(UIView * _Nullable\)view/g' "$file" 2>/dev/null || true
  done
  echo "  ✅ react-native-svg patched"
fi

# ---------- 5. Global: suppress nullability warnings in project ----------
PROJECT_FILE=$(find "$IOS_DIR" -name "project.pbxproj" -not -path "*/Pods/*" -type f | head -n 1)
if [ -n "$PROJECT_FILE" ]; then
  echo "  → Adding nullability warning suppression to project..."
  # Add -Wno-nullability-completeness to OTHER_CFLAGS if not already present
  if ! grep -q "Wno-nullability-completeness" "$PROJECT_FILE" 2>/dev/null; then
    sed -i '' 's/OTHER_CFLAGS = (/OTHER_CFLAGS = ("-Wno-nullability-completeness", /g' "$PROJECT_FILE" 2>/dev/null || true
  fi
  echo "  ✅ Project warnings suppressed"
fi

echo "✅ iOS nullability fixes applied."
