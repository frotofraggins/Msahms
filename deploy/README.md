# MesaHomes Deployment Guide

## Prerequisites

- AWS CLI configured with profile `Msahms` (account 304052673868)
- Node.js 20+
- npm installed

## Architecture

- **Frontend**: Next.js static export → S3 bucket → CloudFront E3TBTUT3LJLAAT
- **Backend**: 14 Lambda functions → API Gateway REST API
- **Data**: DynamoDB single-table `mesahomes-main`
- **Domain**: mesahomes.com via Route 53 + ACM cert
- **Region**: us-west-2 (primary), us-west-1 (existing S3 bucket)

## Deployment Steps

### 1. Build Frontend

```bash
cd frontend
npm run build
# Output: frontend/out/ (static HTML/CSS/JS)
```

### 2. Deploy Frontend to S3

```bash
aws s3 sync frontend/out/ s3://mesahomes.com/ \
  --delete \
  --profile Msahms \
  --region us-west-1
```

### 3. Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id E3TBTUT3LJLAAT \
  --paths "/*" \
  --profile Msahms
```

### 4. Deploy Lambda Functions

Each Lambda is packaged from its directory + shared lib/:

```bash
# Example for leads-capture
cd /path/to/repo
zip -r leads-capture.zip lambdas/leads-capture/ lib/ node_modules/ package.json
aws lambda update-function-code \
  --function-name mesahomes-leads-capture \
  --zip-file fileb://leads-capture.zip \
  --profile Msahms \
  --region us-west-2
```

Repeat for all 14 Lambda functions. See `deploy/lambda-config.json` for
memory, timeout, and environment variable configuration per function.

### 5. Run Initial Data Pipeline

```bash
aws lambda invoke \
  --function-name mesahomes-data-pipeline \
  --profile Msahms \
  --region us-west-2 \
  /dev/null
```

### 6. Seed Content

```bash
# Run the content seeding script
npx tsx deploy/seed-content.ts
```

## Environment Variables

See `deploy/env-template.txt` for all required environment variables.
Copy to `.env` and fill in values before deploying.

## Lambda Functions

| Function | Memory | Timeout | Trigger |
|----------|--------|---------|---------|
| leads-capture | 256 MB | 10s | API Gateway |
| tools-calculator | 256 MB | 10s | API Gateway |
| property-lookup | 512 MB | 30s | API Gateway |
| market-data | 256 MB | 5s | API Gateway |
| content-api | 256 MB | 5s | API Gateway |
| ai-proxy | 512 MB | 30s | API Gateway |
| listing-service | 256 MB | 15s | API Gateway |
| auth-api | 256 MB | 10s | API Gateway |
| dashboard-leads | 256 MB | 10s | API Gateway |
| dashboard-team | 256 MB | 10s | API Gateway |
| dashboard-notifications | 256 MB | 10s | API Gateway |
| dashboard-listings | 256 MB | 10s | API Gateway |
| data-pipeline | 1024 MB | 300s | EventBridge cron |
| notification-worker | 256 MB | 10s | DynamoDB Streams |
