/**
 * CloudFront Function: SPA-style URL rewrites for static export.
 *
 * Deployed separately from the CDK stack (the CloudFront distribution
 * E3TBTUT3LJLAAT predates CDK ownership). Attach this function to the
 * distribution's default cache behavior as a viewer-request trigger.
 *
 * Handles two patterns:
 *
 * 1. Dashboard dynamic route — /dashboard/leads/ANY_ID → /dashboard/leads/_/
 *    Static export produced one shell at /dashboard/leads/_/index.html.
 *    Client-side code reads the real id from window.location.pathname.
 *
 * 2. Standard static-site index fallback — /some/path → /some/path/index.html
 *    S3 static website hosting does this automatically, but when S3 is an
 *    origin via REST (not website) endpoint, CloudFront needs to do it.
 *
 * Deploy:
 *   aws cloudfront create-function \
 *     --name mesahomes-spa-rewrite \
 *     --function-config '{"Comment":"SPA rewrites for static export","Runtime":"cloudfront-js-2.0"}' \
 *     --function-code fileb://infrastructure/cdk/cloudfront-spa-rewrite.js \
 *     --profile Msahms --region us-east-1
 *
 *   # Then publish and attach — see infrastructure/cdk/README.md
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Rule 1: Dashboard dynamic routes
  if (uri.match(/^\/dashboard\/leads\/[^/]+\/?$/)) {
    // Already normalized if it ends in /leads/_/
    if (!uri.match(/^\/dashboard\/leads\/_\/?$/)) {
      request.uri = '/dashboard/leads/_/index.html';
      return request;
    }
  }

  // Rule 2: Append index.html for clean URLs
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    // /some/path → /some/path/index.html
    request.uri = uri + '/index.html';
  }

  return request;
}
