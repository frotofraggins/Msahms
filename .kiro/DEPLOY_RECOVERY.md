# Deploy Recovery — Clean Up from Failed Initial Deploy

Status: recovery needed before first successful `cdk deploy`.
Caused by 2 failed deploy attempts on 2026-04-26 (first over pre-existing
secrets, second over `CloudWatch Logs role`). Both ended in
`ROLLBACK_COMPLETE` and left orphaned AWS resources that CDK cannot
reconcile on retry.

## What happened

1. **Attempt 1** (3:18 AM): CDK tried to CREATE Secrets Manager entries
   and Route 53 records that already existed from manual setup. Failed
   with `AlreadyExists`. Rollback skipped DynamoDB, S3, Cognito pool
   (they have `RemovalPolicy.RETAIN`) so those stayed.

2. **Attempt 2** (3:26 AM): CDK fix imported secrets + removed SES
   construct. API Gateway stage refused to create because no
   CloudWatch Logs role was set at the account level. Another
   `AWS::IAM::Role` is needed per AWS account before any API Gateway
   logging works. Attempt failed, rollback skipped all retained
   resources AGAIN.

After both rollbacks:

| Resource | State | Empty? | Safe to delete? |
|---|---|---|---|
| DynamoDB `mesahomes-main` | orphaned, ACTIVE | Yes, 0 items | Yes |
| S3 `mesahomes-data` | orphaned, empty | Yes | Yes |
| S3 `mesahomes-property-photos` | orphaned, empty | Yes | Yes |
| Cognito user pool `us-west-2_CSWSeXwKj` | orphaned | Yes, 0 users | Yes |
| Cognito user pool `us-west-2_oc6kfp0dJ` | orphaned | Yes, 0 users | Yes |
| API Gateway CloudWatch Logs role | properly set up | — | No, KEEP |
| 11 Secrets Manager secrets (mesahomes/*) | properly set up | Have real values | No, KEEP |
| Route 53 TXT/MX/DMARC records | properly set up | — | No, KEEP |

## Step 1 — Delete orphaned resources

```bash
# DynamoDB
aws dynamodb delete-table --table-name mesahomes-main \
  --profile Msahms --region us-west-2

# S3 buckets (already empty; delete directly)
aws s3 rb s3://mesahomes-data --profile Msahms --region us-west-2
aws s3 rb s3://mesahomes-property-photos --profile Msahms --region us-west-2

# Cognito pools (both orphaned copies)
aws cognito-idp delete-user-pool --user-pool-id us-west-2_CSWSeXwKj \
  --profile Msahms --region us-west-2
aws cognito-idp delete-user-pool --user-pool-id us-west-2_oc6kfp0dJ \
  --profile Msahms --region us-west-2
```

## Step 2 — Verify CDK stack is gone

```bash
aws cloudformation describe-stacks --stack-name MesaHomesStack \
  --profile Msahms --region us-west-2
# Should error with "Stack with id MesaHomesStack does not exist"
```

If it exists in any other state (ROLLBACK_COMPLETE, CREATE_FAILED, etc.),
delete it first:

```bash
aws cloudformation delete-stack --stack-name MesaHomesStack \
  --profile Msahms --region us-west-2
aws cloudformation wait stack-delete-complete --stack-name MesaHomesStack \
  --profile Msahms --region us-west-2
```

## Step 3 — Fresh deploy

```bash
cd /path/to/repo
bash infrastructure/cdk/package-lambdas.sh
npx cdk diff --profile Msahms   # sanity check
npx cdk deploy --profile Msahms --require-approval never
```

Expected time: ~8-12 minutes on first clean run.

Expected output ends with `✅ MesaHomesStack` and CloudFormation outputs
for ApiUrl, UserPoolId, UserPoolClientId, TableName, DataBucketName,
PhotosBucketName.

## If deploy STILL fails on the clean retry

Diagnose carefully before deleting anything else. Common causes:
- CDK assets S3 bucket full or permissions changed (run
  `npx cdk bootstrap` again to refresh)
- A Lambda zip in `.build/` is stale (rerun `package-lambdas.sh`)
- Secrets Manager soft-deleted entries within the same name (force
  delete with `aws secretsmanager delete-secret --force-delete-without-recovery`)

## Preventing future recurrence

Three things now in CDK stack (commit `0444956`):
1. Secrets imported via `Secret.fromSecretNameV2()` — no more
   CREATE attempts on existing secrets
2. SES construct removed entirely — Google Workspace handles email;
   no Route 53 record collisions
3. Lambda SES permissions granted inline with `ses:SendEmail`

Three things NOT yet in CDK (intentional — manual account-level setup):
- API Gateway CloudWatch Logs role — one-time per AWS account
- Google Workspace MX/DKIM/DMARC records — Google-managed, lifecycle
  separate from app deploys
- SES domain identity verification — do post-launch via Console

## After successful deploy

Follow `OWNER-LAUNCH-CHECKLIST.md` from Track 1 step 1.8 onward:
- Seed content
- Upload frontend
- Smoke test

And follow up on:
- Verify mesahomes.com as SES sender identity (Console, 2 min) if you
  want transactional email to actually send
- Consider rolling the live Stripe secret key that was briefly exposed
  in chat on 2026-04-25 (owner declined)
