# MesaHomes CDK Deployment Guide

One-command deploy of the full backend infrastructure.

## Prerequisites

```bash
# Install CDK CLI globally once
npm install -g aws-cdk

# Install CDK packages in this repo
npm install --save-dev aws-cdk-lib@^2 constructs@^10 tsx

# Verify your AWS profile works
aws sts get-caller-identity --profile Msahms
# Should print account 304052673868
```

## First-time CDK bootstrap (already done if StackPro uses CDK)

CDK needs an S3 bucket and IAM role to deploy from. Check if it's set up:

```bash
aws cloudformation describe-stacks --stack-name CDKToolkit --profile Msahms --region us-west-2 2>&1 | head -5
```

If it returns a stack, you're bootstrapped. If not:

```bash
npx cdk bootstrap aws://304052673868/us-west-2 --profile Msahms
```

## Deploy — 3 commands

```bash
# 1. Compile + package the 14 Lambda zips
bash infrastructure/cdk/package-lambdas.sh

# 2. Preview what will change (always do this first)
npx cdk diff --profile Msahms

# 3. Deploy
npx cdk deploy --profile Msahms
```

Takes ~10 minutes on first deploy. After that, only changed resources update.

## Post-deploy: populate secrets

The stack creates 7 empty secrets. Populate them before invoking any Lambda:

```bash
aws secretsmanager put-secret-value --secret-id mesahomes/google-maps-api-key --secret-string "YOUR_GOOGLE_MAPS_KEY" --profile Msahms
aws secretsmanager put-secret-value --secret-id mesahomes/stripe-secret-key --secret-string "sk_test_YOUR_KEY" --profile Msahms
aws secretsmanager put-secret-value --secret-id mesahomes/stripe-webhook-secret --secret-string "whsec_YOUR_SECRET" --profile Msahms
aws secretsmanager put-secret-value --secret-id mesahomes/rentcast-api-key --secret-string "YOUR_RENTCAST_KEY" --profile Msahms
aws secretsmanager put-secret-value --secret-id mesahomes/ses-smtp-credentials --secret-string '{"username":"...","password":"..."}' --profile Msahms
aws secretsmanager put-secret-value --secret-id mesahomes/vhz-handoff-secret --secret-string "$(openssl rand -hex 32)" --profile Msahms
aws secretsmanager put-secret-value --secret-id mesahomes/vhz-webhook-secret --secret-string "$(openssl rand -hex 32)" --profile Msahms
```

The last two (`vhz-*`) are for the VHZ Stripe handoff; use the SAME values on virtualhomezone.com.

## Post-deploy: seed content

Pull the API URL from CloudFormation outputs, update frontend env, then seed:

```bash
# Get the outputs
aws cloudformation describe-stacks --stack-name MesaHomesStack --profile Msahms --region us-west-2 --query 'Stacks[0].Outputs'

# Seed DynamoDB with 6 city pages + 3 blog posts
npx tsx deploy/seed-content.ts
```

## Post-deploy: build and upload frontend

```bash
# Set env vars from CloudFormation outputs in frontend/.env.production
cat > frontend/.env.production <<EOF
NEXT_PUBLIC_API_BASE=https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/prod/api/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-west-2_XXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=YYYYY
NEXT_PUBLIC_LISTINGS_PAYMENT_ENABLED=false
EOF

# Build
cd frontend && npm run build

# Upload to S3 (the existing mesahomes.com bucket)
aws s3 sync out/ s3://mesahomes.com/ --delete --profile Msahms --region us-west-1

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E3TBTUT3LJLAAT --paths "/*" --profile Msahms
```

## Updating after initial deploy

For code-only Lambda changes:

```bash
bash infrastructure/cdk/package-lambdas.sh
npx cdk deploy --profile Msahms
```

For infra changes (new Lambda, new DynamoDB GSI, etc.):

```bash
# Edit infrastructure/cdk/stack.ts
npx cdk diff --profile Msahms
npx cdk deploy --profile Msahms
```

## Destroy (⚠️ dangerous — production data)

Only for dev/staging environments. The stack has `RemovalPolicy.RETAIN`
on DynamoDB, S3, Cognito, and Secrets Manager so **destroying the stack
does NOT delete those resources.** They'll orphan in your account — you
must delete them manually afterward if you truly want a clean slate.

```bash
npx cdk destroy --profile Msahms
```

## Package.json scripts (add these)

```json
{
  "scripts": {
    "cdk:package": "bash infrastructure/cdk/package-lambdas.sh",
    "cdk:diff": "cdk diff --profile Msahms",
    "cdk:deploy": "npm run cdk:package && cdk deploy --profile Msahms",
    "cdk:synth": "cdk synth"
  }
}
```

Then deploys become `npm run cdk:deploy`.

## Troubleshooting

**"No credentials found"**: `aws sso login --profile Msahms` or refresh your creds

**"Stack already exists"**: That's fine — CDK will update in place

**"Resource X already exists in another stack"**: StackPro and MesaHomes
share the account; if names collide (e.g., a Secret with same name in
another stack), rename the MesaHomes one in `stack.ts`

**Lambda zip too large**: Our Lambdas don't need node_modules (we use
native fetch + AWS SDK which is included in Node 20 runtime). If you
add an npm dep that isn't in the runtime, switch to CDK `NodejsFunction`
construct which bundles with esbuild

**CDK can't find `.build/*.zip`**: Run `bash infrastructure/cdk/package-lambdas.sh` first

**Cognito user pool ID needs to reach frontend**: After deploy, read
outputs and set `NEXT_PUBLIC_COGNITO_USER_POOL_ID` in `frontend/.env.production`
then rebuild the frontend

## CloudFront SPA Rewrite Function (one-time setup)

The existing CloudFront distribution `E3TBTUT3LJLAAT` needs a viewer-request
function attached so `/dashboard/leads/:id` paths all serve the same shell
(client-side code reads the id from `window.location.pathname`).

```bash
# 1. Create the function
aws cloudfront create-function \
  --name mesahomes-spa-rewrite \
  --function-config '{"Comment":"SPA rewrites for static export","Runtime":"cloudfront-js-2.0"}' \
  --function-code fileb://infrastructure/cdk/cloudfront-spa-rewrite.js \
  --profile Msahms --region us-east-1

# Response includes ETag and FunctionARN — save both

# 2. Publish the function (move from DEVELOPMENT to LIVE stage)
aws cloudfront publish-function \
  --name mesahomes-spa-rewrite \
  --if-match <ETAG-FROM-STEP-1> \
  --profile Msahms

# 3. Get the current distribution config
aws cloudfront get-distribution-config \
  --id E3TBTUT3LJLAAT \
  --profile Msahms > /tmp/cf-config.json

# 4. Extract ETag (you'll need it for the update)
CF_ETAG=$(jq -r .ETag /tmp/cf-config.json)

# 5. Edit /tmp/cf-config.json — add FunctionAssociations to DefaultCacheBehavior:
#    "FunctionAssociations": {
#      "Quantity": 1,
#      "Items": [{
#        "FunctionARN": "arn:aws:cloudfront::304052673868:function/mesahomes-spa-rewrite",
#        "EventType": "viewer-request"
#      }]
#    }
#    (remove the wrapper "DistributionConfig" key; update-distribution
#     expects just the inner object)

# 6. Apply the update
aws cloudfront update-distribution \
  --id E3TBTUT3LJLAAT \
  --distribution-config file:///tmp/cf-config.json \
  --if-match "$CF_ETAG" \
  --profile Msahms

# 7. Wait ~5 minutes for CloudFront to roll out, then test:
curl -sI https://mesahomes.com/dashboard/leads/test-id-12345
# Should return 200 OK with content from /dashboard/leads/_/index.html
```

Once done this is set-and-forget. The function runs at every edge location
at sub-millisecond cost (~$0.10 per million requests).

