#!/bin/bash

# Script pour corriger les erreurs de nullability dans expo-file-system
# Doit être exécuté après expo prebuild ET après pod install

set -e

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

# Patch in node_modules (before pod install)
NODE_MODULES_FILE="node_modules/expo-file-system/ios/Legacy/EXSessionTasks/EXSessionTaskDelegate.h"
if patch_delegate_file "$NODE_MODULES_FILE"; then
  echo "✅ Fixed in node_modules"
fi

# Patch in Pods (after pod install, if Pods exists)
PODS_FILE="ios/Pods/ExpoFileSystem/ios/Legacy/EXSessionTasks/EXSessionTaskDelegate.h"
if [ -f "$PODS_FILE" ]; then
  if patch_delegate_file "$PODS_FILE"; then
    echo "✅ Fixed in Pods"
  fi
else
  echo "ℹ️ Pods file not found yet (will be fixed after pod install)"
fi

echo ""
echo "✅ Nullability fixes applied successfully!"
