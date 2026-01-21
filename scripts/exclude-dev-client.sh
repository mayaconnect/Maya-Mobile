#!/bin/bash

# Script pour exclure expo-dev-client des builds de production iOS
# expo-dev-client cause des erreurs de runtime de simulateur et n'est pas nécessaire en production

set +e  # Don't exit on error

echo "🔧 Excluding expo-dev-client from production iOS build..."

PODFILE_PATH="ios/Podfile"

if [ ! -f "$PODFILE_PATH" ]; then
  echo "⚠️ Podfile not found at $PODFILE_PATH"
  exit 0  # Not a critical error, continue
fi

echo "📝 Modifying Podfile to exclude expo-dev-client..."

# Backup Podfile
cp "$PODFILE_PATH" "$PODFILE_PATH.bak" 2>/dev/null || true

# Method 1: Comment out ExpoDevLauncher pod if explicitly listed
if grep -q "pod.*ExpoDevLauncher" "$PODFILE_PATH"; then
  sed -i '' 's/^\(.*pod.*ExpoDevLauncher.*\)$/# \1  # Excluded from production builds/' "$PODFILE_PATH"
  echo "✅ Commented out ExpoDevLauncher pod"
fi

# Method 2: Add post_install hook to exclude from build and skip asset compilation
# Check if exclusion marker already exists
if grep -q "# Exclude expo-dev-client from production" "$PODFILE_PATH"; then
  echo "ℹ️ expo-dev-client exclusion already present in Podfile"
else
  # Simple and reliable: always append a new post_install hook at the end
  # CocoaPods will execute all post_install blocks, so this is safe even if one exists
  cat >> "$PODFILE_PATH" << 'EOF'

# Exclude expo-dev-client from production builds
# This prevents simulator runtime errors during asset compilation
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if target.name == "ExpoDevLauncher"
      target.build_configurations.each do |config|
        # Skip building for all SDKs to avoid simulator runtime errors
        config.build_settings["EXCLUDED_ARCHS[sdk=*]"] = "$(ARCHS_STANDARD)"
        config.build_settings["ONLY_ACTIVE_ARCH"] = "NO"
        # Skip asset compilation to avoid simulator runtime errors
        config.build_settings["ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS"] = "NO"
      end
    end
  end
end
EOF
  echo "✅ Added post_install hook to exclude expo-dev-client"
fi

echo "✅ expo-dev-client exclusion configured"
echo ""

