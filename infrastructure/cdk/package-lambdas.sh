#!/usr/bin/env bash
# Packages each Lambda's source into .build/<name>.zip for CDK to consume.
# Bundles the Lambda's own code + shared lib/ + package.json.
# Does NOT install node_modules (Lambda node_modules are too heavy; use CDK
# NodejsFunction for bundling if you need npm deps — see README note).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILD_DIR="$REPO_ROOT/.build"

LAMBDAS=(
  leads-capture tools-calculator property-lookup market-data content-api
  ai-proxy listing-service auth-api dashboard-leads dashboard-team
  dashboard-notifications dashboard-listings dashboard-content data-pipeline notification-worker
  content-ingest content-bundler content-drafter photo-finder
)

echo "Compiling TypeScript..."
cd "$REPO_ROOT" && npx tsc --project tsconfig.json

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

for name in "${LAMBDAS[@]}"; do
  staging="$BUILD_DIR/stage-$name"
  mkdir -p "$staging/lambdas/$name"
  # Copy compiled lambda code into lambdas/<name>/ preserving relative paths
  cp -r "$REPO_ROOT/dist/lambdas/$name/"* "$staging/lambdas/$name/"
  # Drafter shares photo-finder code — include it too so ../photo-finder
  # imports resolve inside the Lambda runtime
  if [ "$name" = "content-drafter" ]; then
    mkdir -p "$staging/lambdas/photo-finder"
    cp -r "$REPO_ROOT/dist/lambdas/photo-finder/"* "$staging/lambdas/photo-finder/"
  fi
  # Copy shared lib (compiled) — lambdas import ../../lib/*.js so this
  # must sit at the repo root level inside the zip
  mkdir -p "$staging/lib"
  cp -r "$REPO_ROOT/dist/lib/"* "$staging/lib/"
  # Package.json for type:module resolution
  cp "$REPO_ROOT/package.json" "$staging/package.json"

  # dashboard-content needs @aws-sdk/client-codebuild bundled (not in
  # Lambda runtime default SDK subset).
  if [ "$name" = "dashboard-content" ]; then
    mkdir -p "$staging/node_modules"
    cp -r "$REPO_ROOT/node_modules/@aws-sdk/client-codebuild" "$staging/node_modules/@aws-sdk/" 2>/dev/null || true
    # client-codebuild has transitive deps — copy the whole @aws-sdk + @smithy trees
    cp -r "$REPO_ROOT/node_modules/@aws-sdk" "$staging/node_modules/" 2>/dev/null || true
    cp -r "$REPO_ROOT/node_modules/@smithy" "$staging/node_modules/" 2>/dev/null || true
  fi

  (cd "$staging" && zip -rq "$BUILD_DIR/$name.zip" .)
  rm -rf "$staging"
  echo "  ✔ $name.zip"
done

echo ""
echo "Done. $BUILD_DIR contains ${#LAMBDAS[@]} zips."
echo "Run: npx cdk deploy --profile Msahms"
