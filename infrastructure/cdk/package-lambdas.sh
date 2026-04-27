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
  dashboard-notifications dashboard-listings data-pipeline notification-worker
  content-ingest content-bundler content-drafter
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
  # Copy shared lib (compiled) — lambdas import ../../lib/*.js so this
  # must sit at the repo root level inside the zip
  mkdir -p "$staging/lib"
  cp -r "$REPO_ROOT/dist/lib/"* "$staging/lib/"
  # Package.json for type:module resolution
  cp "$REPO_ROOT/package.json" "$staging/package.json"

  (cd "$staging" && zip -rq "$BUILD_DIR/$name.zip" .)
  rm -rf "$staging"
  echo "  ✔ $name.zip"
done

echo ""
echo "Done. $BUILD_DIR contains ${#LAMBDAS[@]} zips."
echo "Run: npx cdk deploy --profile Msahms"
