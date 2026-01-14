#!/bin/bash

# Script pour corriger les erreurs de nullability dans expo-file-system
# Doit être exécuté après expo prebuild

set -e

echo "🔧 Fixing iOS nullability issues in expo-file-system..."

DELEGATE_FILE="node_modules/expo-file-system/ios/Legacy/EXSessionTasks/EXSessionTaskDelegate.h"

if [ ! -f "$DELEGATE_FILE" ]; then
  echo "⚠️ Warning: $DELEGATE_FILE not found. Skipping nullability fix."
  exit 0
fi

echo "📝 Patching $DELEGATE_FILE..."

# Backup original file
cp "$DELEGATE_FILE" "$DELEGATE_FILE.bak"

# Fix nullability annotations
cat > "$DELEGATE_FILE" << 'EOF'
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

echo "✅ Nullability issues fixed!"
