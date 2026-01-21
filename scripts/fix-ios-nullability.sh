#!/bin/bash

# Script pour corriger les erreurs de nullability dans expo-file-system
# Doit être exécuté après expo prebuild ET après pod install

# Don't exit on error, handle errors gracefully
set +e

echo "🔧 Fixing iOS nullability issues in expo-file-system..."

# Function to patch a file with nullability annotations
patch_delegate_file() {
  local file_path=$1

  if [ ! -f "$file_path" ]; then
    echo "⚠️ File not found: $file_path"
    return 1
  fi

  echo "📝 Patching $file_path..."

  # Backup original file
  cp "$file_path" "$file_path.bak" 2>/dev/null || true

  # Fix nullability annotations
  cat > "$file_path" << 'EOF'
// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXSessionTaskDelegate <NSObject>

- (void)URLSession:(NSURLSession * _Nonnull)session
              task:(NSURLSessionTask * _Nonnull)task
didCompleteWithError:(NSError * _Nullable)error;

- (void)URLSession:(NSURLSession * _Nonnull)session
          dataTask:(NSURLSessionDataTask * _Nonnull)dataTask
    didReceiveData:(NSData * _Nonnull)data;

- (void)URLSession:(NSURLSession * _Nonnull)session
      downloadTask:(NSURLSessionDownloadTask * _Nonnull)downloadTask
didFinishDownloadingToURL:(NSURL * _Nonnull)location;

- (void)URLSession:(NSURLSession * _Nonnull)session
              task:(NSURLSessionTask * _Nonnull)task
   didSendBodyData:(int64_t)bytesSent
    totalBytesSent:(int64_t)totalBytesSent
totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend;

@end

NS_ASSUME_NONNULL_END
EOF

  echo "✅ Patched $file_path"
  return 0
}

# Function to ensure proper import in dependent files
fix_delegate_imports() {
  local base_dir=$1

  # Fix EXSessionUploadTaskDelegate.h
  local upload_file="${base_dir}/EXSessionUploadTaskDelegate.h"
  if [ -f "$upload_file" ]; then
    echo "📝 Fixing imports in $upload_file..."
    # Ensure it imports EXSessionTaskDelegate.h
    if ! grep -q '#import "EXSessionTaskDelegate.h"' "$upload_file"; then
      sed -i '' '1a\
#import "EXSessionTaskDelegate.h"
' "$upload_file"
      echo "✅ Added import to $upload_file"
    fi
  fi

  # Fix EXSessionDownloadTaskDelegate.h
  local download_file="${base_dir}/EXSessionDownloadTaskDelegate.h"
  if [ -f "$download_file" ]; then
    echo "📝 Fixing imports in $download_file..."
    # Ensure it imports EXSessionTaskDelegate.h
    if ! grep -q '#import "EXSessionTaskDelegate.h"' "$download_file"; then
      sed -i '' '1a\
#import "EXSessionTaskDelegate.h"
' "$download_file"
      echo "✅ Added import to $download_file"
    fi
  fi
}

# Patch in node_modules (before pod install)
NODE_MODULES_DIR="node_modules/expo-file-system/ios/Legacy/EXSessionTasks"
NODE_MODULES_FILE="${NODE_MODULES_DIR}/EXSessionTaskDelegate.h"
if patch_delegate_file "$NODE_MODULES_FILE"; then
  echo "✅ Fixed in node_modules"
  fix_delegate_imports "$NODE_MODULES_DIR"
fi

# Patch in Pods (after pod install, if Pods exists)
PODS_DIR="ios/Pods/ExpoFileSystem/ios/Legacy/EXSessionTasks"
PODS_FILE="${PODS_DIR}/EXSessionTaskDelegate.h"
if [ -f "$PODS_FILE" ]; then
  if patch_delegate_file "$PODS_FILE"; then
    echo "✅ Fixed in Pods"
    fix_delegate_imports "$PODS_DIR"
  fi
else
  echo "ℹ️ Pods file not found yet (will be fixed after pod install)"
fi

# Also check Headers in Pods
PODS_HEADERS_DIR="ios/Pods/Headers/Public/ExpoFileSystem"
if [ -d "$PODS_HEADERS_DIR" ]; then
  echo "🔍 Checking Pods Headers..."
  PODS_HEADERS_FILE="${PODS_HEADERS_DIR}/EXSessionTaskDelegate.h"
  if [ -f "$PODS_HEADERS_FILE" ]; then
    patch_delegate_file "$PODS_HEADERS_FILE"
    echo "✅ Fixed in Pods Headers"
  fi
fi

echo ""
echo "✅ Nullability fixes applied successfully!"