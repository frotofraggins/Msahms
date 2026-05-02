# CI/CD via GitHub Actions + AWS OIDC

Author: Kiro A, 2026-04-27 (backfilled from implementation).
Status: SHIPPED. Live in production.

## Purpose

Replace the original manual `cdk deploy` + `aws s3 sync` flow with a
fully automated CI/CD pipeline triggered by push to `main`. Also
eliminate the long-lived AWS credentials we had stored in GitHub
(there were none — we never added any — but this prevents that
pattern from ever being needed).

## Outcome

**On every push to `main`** the entire stack redeploys automatically:

```
git push origin main
  ↓
GitHub Actions runner (ubuntu-latest, free tier)
  ↓
1. Checkout
2. Node 20 + npm ci (root + frontend)
3. npx tsc --noEmit          (typecheck gate)
4. npx vitest run            (test gate — 879 tests)
5. Assume AWS IAM role via OIDC (no stored creds)
6. package-lambdas.sh        (20 zips)
7. cdk deploy                (unless skip_cdk=true)
8. Frontend build            (prebuild hook pulls published blogs from DDB)
9. aws s3 sync to mesahomes.com
10. CloudFront invalidation
  ↓
Production updated in ~4-6 minutes
```

## Non-goals

- **Multi-environment (dev/staging/prod)**. Not yet needed at MVP.
- **Blue/green or canary deploys**. Static site + Lambda versioning
  handle rollback fine for our scale.
- **Approval gate between synth and deploy**. Trusted owner, all
  commits are reviewed by the author. Can add later if team grows.

## Security design

**OIDC federation, no long-lived credentials.**

### GitHub side
- Workflow declares `permissions: id-token: write, contents: read`
- When `aws-actions/configure-aws-credentials@v4` runs, GitHub issues
  a short-lived OIDC JWT with claims like
  `repo:frotofraggins/Msahms:ref:refs/heads/main`
- Token is passed to AWS STS AssumeRoleWithWebIdentity

### AWS side
- OIDC provider registered for `token.actions.githubusercontent.com`
- IAM role `mesahomes-github-actions-deploy` has trust policy:
  ```
  Principal: { Federated: <OIDC provider ARN> }
  Action: sts:AssumeRoleWithWebIdentity
  Condition:
    StringEquals: token.actions.githubusercontent.com:aud = sts.amazonaws.com
    StringLike:   token.actions.githubusercontent.com:sub = repo:frotofraggins/Msahms:*
  ```
- Role has `AdministratorAccess` managed policy (CDK deploy needs
  broad permissions; alternative would be scoping to CDK bootstrap
  role but that's complex to maintain).
- Max session duration: 1 hour.

Any push from the `frotofraggins/Msahms` repo can assume this role.
Pushes from other repos, forks, or external contributors cannot.

## Components

### `.github/workflows/deploy.yml`

Single workflow, two triggers:
- `on: push: branches: [main]` — normal deploy flow
- `on: workflow_dispatch: inputs.skip_cdk` — manual triggering with
  optional infra-skip flag

Concurrency group `production-deploy` with `cancel-in-progress: false`
ensures only one deploy runs at a time. Queued deploys wait their
turn; they don't pile up.

### `infrastructure/cdk/stack.ts`

Two constructs added:

```ts
const githubProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
  url: 'https://token.actions.githubusercontent.com',
  clientIds: ['sts.amazonaws.com'],
});

const githubDeployRole = new iam.Role(this, 'GitHubDeployRole', {
  roleName: 'mesahomes-github-actions-deploy',
  assumedBy: new iam.FederatedPrincipal(
    githubProvider.openIdConnectProviderArn,
    {
      StringEquals: { '...:aud': 'sts.amazonaws.com' },
      StringLike:   { '...:sub': 'repo:frotofraggins/Msahms:*' },
    },
    'sts:AssumeRoleWithWebIdentity',
  ),
  maxSessionDuration: Duration.hours(1),
});
githubDeployRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
);
```

## Approve-triggered deploys

When the owner clicks Approve on an AI-drafted blog post:

```
[Approve click in /dashboard/content/drafts/{id}]
  ↓
dashboard-content Lambda
  1. Writes CONTENT#BLOG#{slug} to DDB
  2. Fetches mesahomes/live/github-pat from Secrets Manager
  3. POSTs to api.github.com/repos/.../actions/workflows/deploy.yml/dispatches
     Body: { ref: 'main', inputs: { skip_cdk: 'true' } }
  ↓
GHA workflow runs with skip_cdk=true (faster, frontend-only)
  ↓
Published blog live on /blog/{category}/{slug}/ in ~3 min
```

This replaced a CodeBuild project that was the original
approve-trigger mechanism. CodeBuild was removed in the same
commit that introduced GHA CI/CD.

## One-time setup (DONE)

1. CDK deploy (creates OIDC provider + deploy role): `cdk deploy`
2. Create GitHub PAT at github.com/settings/tokens:
   - Scopes: `repo` + `workflow`
   - Expiration: 1 year
3. Store in Secrets Manager:
   ```
   aws secretsmanager create-secret \
     --name mesahomes/live/github-pat \
     --secret-string ghp_YOUR_TOKEN \
     --profile Msahms --region us-west-2
   ```
4. Push any commit to `main` to verify the pipeline works end-to-end.

## Cost

- GitHub Actions: free tier is 2,000 minutes/month on private repos.
  A typical deploy takes 3-5 minutes. Even with 50 deploys/month =
  250 minutes = within free tier.
- AWS costs unchanged. We removed CodeBuild, which was costing ~$0.50/
  run.

## Rollback procedure

No automated rollback. If a deploy breaks production:

1. `git revert <bad-commit>` — creates a new commit reverting changes
2. `git push origin main`
3. GHA deploys the reverted code automatically in 4-6 minutes

Do NOT manually `cdk deploy` from a laptop while GHA is running — the
concurrency group protects against that but still not recommended.

## Observability

- **GitHub Actions run history**: https://github.com/frotofraggins/Msahms/actions
- **Every run shows**: which commit, which steps passed/failed, full
  logs for any failing step
- **Notifications**: GitHub emails the committer on failure (default
  GitHub Actions behavior)

## Tasks completed

- [x] Add GitHub OIDC provider to CDK stack
- [x] Add `mesahomes-github-actions-deploy` IAM role with OIDC trust
- [x] Create `.github/workflows/deploy.yml`
- [x] Concurrency group to prevent overlapping deploys
- [x] Test gate (tsc + vitest) before any AWS action
- [x] OIDC assume-role via aws-actions/configure-aws-credentials@v4
- [x] package-lambdas.sh + cdk deploy steps
- [x] Frontend build + S3 sync + CloudFront invalidation steps
- [x] Update dashboard-content approve handler to trigger GHA
      workflow_dispatch instead of CodeBuild
- [x] Remove CodeBuild project from CDK stack
- [x] Store GitHub PAT in Secrets Manager at `mesahomes/live/github-pat`
- [x] First successful deploy via GHA pipeline (2026-04-27)
- [x] Verified approve-triggered rebuild publishes new blog post

## Open work

- [ ] Add manual approval gate between test + deploy steps once team
      grows past the owner (currently skipped for speed)
- [ ] Slack/email notification to owner on deploy failures (currently
      relies on GitHub email default)
- [ ] Rollback button in dashboard settings (would trigger workflow
      to revert the last commit) — nice-to-have

## Related

- `.kiro/STEERING.md` — "Change tracking + deployment process"
  section lists deploy steps + required secrets
- `.kiro/specs/content-pipeline-phase-2.md` — describes the rebuild-
  on-approve flow that depends on this pipeline
