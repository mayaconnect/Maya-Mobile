#!/bin/bash
# Script pour configurer la signature release dans build.gradle

BUILD_GRADLE="android/app/build.gradle"

if [ ! -f "$BUILD_GRADLE" ]; then
    echo "❌ ERROR: build.gradle not found at $BUILD_GRADLE"
    exit 1
fi

echo "🔧 Configuring release signing in build.gradle..."

# Create a backup
cp "$BUILD_GRADLE" "$BUILD_GRADLE.backup"

# Check if signingConfigs already exists
if grep -q "signingConfigs {" "$BUILD_GRADLE"; then
    echo "⚠️ signingConfigs already exists, will update it"
    # Remove existing signingConfigs block (between signingConfigs { and closing })
    sed -i '/signingConfigs {/,/^    }$/d' "$BUILD_GRADLE"
fi

# Find the position to insert signingConfigs (after defaultConfig block)
if grep -q "defaultConfig {" "$BUILD_GRADLE"; then
    # Insert after defaultConfig block closes
    awk '
    /defaultConfig \{/ { in_default = 1 }
    in_default && /^    \}/ { 
        print
        print ""
        print "    signingConfigs {"
        print "        release {"
        print "            if (project.hasProperty(\"MAYA_UPLOAD_STORE_FILE\")) {"
        print "                storeFile file(MAYA_UPLOAD_STORE_FILE)"
        print "                storePassword MAYA_UPLOAD_STORE_PASSWORD"
        print "                keyAlias MAYA_UPLOAD_KEY_ALIAS"
        print "                keyPassword MAYA_UPLOAD_KEY_PASSWORD"
        print "            }"
        print "        }"
        print "    }"
        in_default = 0
        next
    }
    { print }
    ' "$BUILD_GRADLE" > "$BUILD_GRADLE.tmp" && mv "$BUILD_GRADLE.tmp" "$BUILD_GRADLE"
else
    # Insert after android { if no defaultConfig
    sed -i '/^android {/a\
    signingConfigs {\
        release {\
            if (project.hasProperty("MAYA_UPLOAD_STORE_FILE")) {\
                storeFile file(MAYA_UPLOAD_STORE_FILE)\
                storePassword MAYA_UPLOAD_STORE_PASSWORD\
                keyAlias MAYA_UPLOAD_KEY_ALIAS\
                keyPassword MAYA_UPLOAD_KEY_PASSWORD\
            }\
        }\
    }
' "$BUILD_GRADLE"
fi

# Ensure release buildType uses signingConfig
if grep -q "buildTypes {" "$BUILD_GRADLE"; then
    if grep -q "release {" "$BUILD_GRADLE"; then
        # Check if signingConfig is already there
        if ! grep -A 5 "release {" "$BUILD_GRADLE" | grep -q "signingConfig"; then
            sed -i '/release {/a\
            signingConfig signingConfigs.release
' "$BUILD_GRADLE"
        fi
    else
        # Add release buildType
        sed -i '/buildTypes {/a\
        release {\
            signingConfig signingConfigs.release\
        }
' "$BUILD_GRADLE"
    fi
fi

echo "✅ Release signing configured in build.gradle"
echo "🔍 Verifying configuration..."
if grep -q "signingConfigs {" "$BUILD_GRADLE" && grep -q "signingConfig signingConfigs.release" "$BUILD_GRADLE"; then
    echo "✅ Configuration verified successfully"
else
    echo "⚠️ WARNING: Configuration verification failed, check build.gradle manually"
    echo "Showing relevant parts:"
    grep -A 10 "signingConfigs" "$BUILD_GRADLE" | head -15
fi

