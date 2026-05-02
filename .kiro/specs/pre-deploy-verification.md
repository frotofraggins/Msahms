# Pre-Deploy Verification Process

**Rule**: Every content-ingest or data-pipeline change goes through this
checklist BEFORE CDK deploy. Not optional. Prevents the "deploy then
discover the source is 406" pattern that burned us on GovDelivery.

## Why

The content pipeline writes to S3 and DynamoDB. Once data is indexed,
fixing bad data means cache-busting and re-ingesting. Easier to catch
before the data lands.

## The 5-step check

Run this sequence when adding a new source OR changing a parser.

### 1. Endpoint works from the Lambda's egress IP

AWS Lambda runs from public AWS IPs in us-west-2. Some sources
(Federal Register, Cloudflare-protected sites) block those ranges.
Test from a non-AWS host if you have one, AND from Lambda directly.

```bash
# From dev desk:
curl -sI -H "User-Agent: MesaHomesBot/1.0 (+https://mesahomes.com)" \
  "{URL}" | head -3

# Expected: 200 OK. If 403/406/429/301 → source won't work from Lambda.
```

### 2. Response shape matches the parser expectation

```bash
curl -s -H "User-Agent: MesaHomesBot/1.0 (+https://mesahomes.com)" \
  "{URL}" | head -50

# Manually verify the fields the parser reads.
```

### 3. Count check — is data reasonable?

```bash
# RSS:
curl -s -H "User-Agent: ..." "{URL}" | grep -c "<item\|<entry"

# JSON array:
curl -s -H "..." "{URL}" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
```

- 0 items = source is empty or URL is wrong → don't add
- 1-5 items = is that the real volume?
- 1000+ items = needs pagination or may cost too much to re-ingest daily

### 4. Invoke the Lambda against the new source BEFORE enabling cron

```bash
aws lambda invoke \
  --function-name mesahomes-content-ingest \
  --payload '{"sourceId":"NEW_SOURCE_ID"}' \
  --profile Msahms --region us-west-2 \
  /tmp/out.json
cat /tmp/out.json
```

Expected output shape:
```json
{"statusCode":200,"results":[{"sourceId":"...","fetched":N,"new":N,"duplicates":0,"errors":0}]}
```

Red flags:
- `fetched: 0` → parser got no items
- `errors > 0` → check CloudWatch logs immediately
- `new: 0` on first run → dedup bug (rare)
- `statusCode: 5xx` → Lambda crashed

### 5. Verify S3 + DDB writes

```bash
# S3:
aws s3 ls s3://mesahomes-content-ingest/NEW_SOURCE_ID/ --recursive \
  --profile Msahms --region us-west-2 | head -5

# DDB:
aws dynamodb query --table-name mesahomes-main \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"SOURCE#NEW_SOURCE_ID"}}' \
  --profile Msahms --region us-west-2 \
  --query 'Count' --output text
```

- If count doesn't match Lambda's `new` field → something's wrong
- If S3 objects are 0 bytes → parser returned empty data

## Data flow record

Every verified source gets a row added to `.kiro/specs/content-ingest-verified-sources.md`
with:
- Source ID
- URL tested
- HTTP status
- Item count on first run
- S3 prefix written
- DDB PK pattern
- Date verified

This is the "how data flows" record the owner asked for. Every source
in production has been through this and documented.

## When NOT to run this

- Pure frontend changes (Next.js, component tweaks)
- Lambda changes that don't touch content ingest
- Docs-only changes

## Reverting

If a post-deploy check fails and data has been written:

1. Delete stale DDB records:
   ```bash
   # List:
   aws dynamodb query --table-name mesahomes-main \
     --key-condition-expression "PK = :pk" \
     --expression-attribute-values '{":pk":{"S":"SOURCE#BROKEN_SOURCE_ID"}}' \
     --profile Msahms --region us-west-2
   # Delete (scripted loop)
   ```
2. Delete stale S3 objects:
   ```bash
   aws s3 rm s3://mesahomes-content-ingest/BROKEN_SOURCE_ID/ --recursive \
     --profile Msahms --region us-west-2
   ```
3. Fix the parser
4. Re-run the 5 steps above
