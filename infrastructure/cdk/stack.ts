/**
 * MesaHomes CDK stack — complete backend infrastructure.
 *
 * Matches the config in `infrastructure/*.ts` and `deploy/lambda-config.json`.
 * Memory/timeout values pulled directly from lambda-config.json so the
 * deploy runbook and the CDK stack stay in sync.
 *
 * Secrets are created as empty placeholders. After `cdk deploy`, run:
 *   aws secretsmanager put-secret-value --secret-id mesahomes/google-maps-api-key --secret-string "YOUR_KEY" --profile Msahms
 * for each of the 6 secrets.
 */
import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MesaHomesSesConstruct } from './ses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..', '..');

// Lambda configs matching deploy/lambda-config.json
const LAMBDA_CONFIGS: Record<string, { source: string; memory: number; timeout: number; env?: Record<string, string> }> = {
  'leads-capture': { source: 'leads-capture', memory: 256, timeout: 10 },
  'tools-calculator': { source: 'tools-calculator', memory: 256, timeout: 10 },
  'property-lookup': { source: 'property-lookup', memory: 512, timeout: 30, env: { GOOGLE_MAPS_SECRET: 'mesahomes/live/google-maps-api-key' } },
  'market-data': { source: 'market-data', memory: 256, timeout: 5 },
  'content-api': { source: 'content-api', memory: 256, timeout: 5 },
  'ai-proxy': { source: 'ai-proxy', memory: 512, timeout: 30 },
  'listing-service': { source: 'listing-service', memory: 256, timeout: 15, env: { LISTINGS_PAYMENT_ENABLED: 'false' } },
  'auth-api': { source: 'auth-api', memory: 256, timeout: 10 },
  'dashboard-leads': { source: 'dashboard-leads', memory: 256, timeout: 10 },
  'dashboard-team': { source: 'dashboard-team', memory: 256, timeout: 10 },
  'dashboard-notifications': { source: 'dashboard-notifications', memory: 256, timeout: 10 },
  'dashboard-listings': { source: 'dashboard-listings', memory: 256, timeout: 10 },
  'data-pipeline': { source: 'data-pipeline', memory: 1024, timeout: 300 },
  'notification-worker': { source: 'notification-worker', memory: 256, timeout: 10 },
};

const SECRET_NAMES = [
  'mesahomes/live/google-maps-api-key',
  'mesahomes/live/stripe-secret-key',
  'mesahomes/live/stripe-publishable-key',
  'mesahomes/live/stripe-webhook-secret',
  'mesahomes/live/vhz-stripe-secret-key',
  'mesahomes/live/rentcast-api-key',
  'mesahomes/live/ses-smtp-credentials',
  'mesahomes/live/vhz-handoff-secret',
  'mesahomes/live/vhz-webhook-secret',
];

// Route definitions — mirrors infrastructure/api-gateway.ts
const ROUTES: Array<{ method: string; path: string; lambda: string; auth: boolean }> = [
  { method: 'POST', path: '/api/v1/leads', lambda: 'leads-capture', auth: false },
  { method: 'POST', path: '/api/v1/valuation-request', lambda: 'leads-capture', auth: false },
  { method: 'POST', path: '/api/v1/booking', lambda: 'leads-capture', auth: false },
  { method: 'POST', path: '/api/v1/tools/net-sheet', lambda: 'tools-calculator', auth: false },
  { method: 'POST', path: '/api/v1/tools/affordability', lambda: 'tools-calculator', auth: false },
  { method: 'POST', path: '/api/v1/tools/comparison', lambda: 'tools-calculator', auth: false },
  { method: 'POST', path: '/api/v1/tools/sell-now-or-wait', lambda: 'tools-calculator', auth: false },
  { method: 'POST', path: '/api/v1/property/lookup', lambda: 'property-lookup', auth: false },
  { method: 'POST', path: '/api/v1/property/comps', lambda: 'property-lookup', auth: false },
  { method: 'GET', path: '/api/v1/market/zip/{zip}', lambda: 'market-data', auth: false },
  { method: 'GET', path: '/api/v1/market/metro', lambda: 'market-data', auth: false },
  { method: 'GET', path: '/api/v1/content/city/{slug}', lambda: 'content-api', auth: false },
  { method: 'GET', path: '/api/v1/content/blog', lambda: 'content-api', auth: false },
  { method: 'GET', path: '/api/v1/content/blog/{slug}', lambda: 'content-api', auth: false },
  { method: 'POST', path: '/api/v1/ai/listing-description', lambda: 'ai-proxy', auth: false },
  { method: 'POST', path: '/api/v1/ai/offer-draft', lambda: 'ai-proxy', auth: false },
  { method: 'POST', path: '/api/v1/listing/start', lambda: 'listing-service', auth: false },
  { method: 'POST', path: '/api/v1/listing/payment', lambda: 'listing-service', auth: false },
  { method: 'POST', path: '/api/v1/listing/fsbo/intake', lambda: 'listing-service', auth: false },
  { method: 'POST', path: '/api/v1/listing/fsbo/vhz-webhook', lambda: 'listing-service', auth: false },
  { method: 'POST', path: '/api/v1/auth/login', lambda: 'auth-api', auth: false },
  { method: 'POST', path: '/api/v1/auth/refresh', lambda: 'auth-api', auth: false },
  { method: 'POST', path: '/api/v1/auth/register', lambda: 'auth-api', auth: false },
  { method: 'GET', path: '/api/v1/dashboard/leads', lambda: 'dashboard-leads', auth: true },
  { method: 'GET', path: '/api/v1/dashboard/leads/{id}', lambda: 'dashboard-leads', auth: true },
  { method: 'PATCH', path: '/api/v1/dashboard/leads/{id}', lambda: 'dashboard-leads', auth: true },
  { method: 'GET', path: '/api/v1/dashboard/team', lambda: 'dashboard-team', auth: true },
  { method: 'POST', path: '/api/v1/dashboard/team/invite', lambda: 'dashboard-team', auth: true },
  { method: 'PATCH', path: '/api/v1/dashboard/team/{agentId}', lambda: 'dashboard-team', auth: true },
  { method: 'GET', path: '/api/v1/dashboard/listings', lambda: 'dashboard-listings', auth: true },
  { method: 'PATCH', path: '/api/v1/dashboard/listings/{id}', lambda: 'dashboard-listings', auth: true },
  { method: 'GET', path: '/api/v1/dashboard/notifications/settings', lambda: 'dashboard-notifications', auth: true },
  { method: 'PUT', path: '/api/v1/dashboard/notifications/settings', lambda: 'dashboard-notifications', auth: true },
];

export class MesaHomesStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // DynamoDB single-table
    const table = new dynamodb.Table(this, 'MainTable', {
      tableName: 'mesahomes-main',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN, // protect production data
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // S3 buckets
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: 'mesahomes-data',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
    });
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: 'mesahomes-property-photos',
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({ restrictPublicBuckets: false, blockPublicAcls: false, blockPublicPolicy: false, ignorePublicAcls: false }),
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [{ allowedOrigins: ['https://mesahomes.com', 'https://www.mesahomes.com'], allowedMethods: [s3.HttpMethods.GET], allowedHeaders: ['*'] }],
    });

    // Cognito
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'mesahomes-userpool',
      signInAliases: { email: true },
      selfSignUpEnabled: false,
      passwordPolicy: { minLength: 12, requireLowercase: true, requireUppercase: true, requireDigits: true, requireSymbols: true },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      customAttributes: {
        role: new cognito.StringAttribute({ minLen: 1, maxLen: 50, mutable: true }),
        teamId: new cognito.StringAttribute({ minLen: 1, maxLen: 100, mutable: true }),
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const userPoolClient = userPool.addClient('DashboardClient', {
      userPoolClientName: 'mesahomes-dashboard-client',
      authFlows: { userPassword: true, userSrp: true },
      accessTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      preventUserExistenceErrors: true,
    });

    // Secrets (empty placeholders)
    const secrets: Record<string, sm.Secret> = {};
    for (const name of SECRET_NAMES) {
      const id = name.replace(/[^a-zA-Z0-9]/g, '');
      secrets[name] = new sm.Secret(this, `Secret-${id}`, {
        secretName: name,
        description: `MesaHomes secret: ${name}. Populate via put-secret-value after deploy.`,
        removalPolicy: RemovalPolicy.RETAIN,
      });
    }

    // Lambda functions
    const fns: Record<string, lambda.Function> = {};
    for (const [name, cfg] of Object.entries(LAMBDA_CONFIGS)) {
      const fn = new lambda.Function(this, `Fn-${name}`, {
        functionName: `mesahomes-${name}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        // Zip the lambda source + shared lib/ folder. You'll package this before `cdk deploy`.
        // See deploy/README.md for the packaging script.
        code: lambda.Code.fromAsset(path.join(REPO_ROOT, '.build', `${cfg.source}.zip`)),
        memorySize: cfg.memory,
        timeout: Duration.seconds(cfg.timeout),
        environment: {
          MESAHOMES_TABLE: table.tableName,
          COGNITO_USER_POOL_ID: userPool.userPoolId,
          COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
          S3_DATA_BUCKET: dataBucket.bucketName,
          S3_PHOTOS_BUCKET: photosBucket.bucketName,
          ...(cfg.env ?? {}),
        },
        tracing: lambda.Tracing.ACTIVE,
      });
      // Grant DynamoDB access to every Lambda (all lambdas read/write the main table)
      table.grantReadWriteData(fn);
      // Grant access to all secrets for simplicity; tighten later if needed
      for (const secret of Object.values(secrets)) {
        secret.grantRead(fn);
      }
      fns[name] = fn;
    }
    // Additional grants
    dataBucket.grantReadWrite(fns['data-pipeline']!);
    photosBucket.grantReadWrite(fns['property-lookup']!);
    photosBucket.grantReadWrite(fns['listing-service']!);
    fns['auth-api']!.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoPowerUser'));
    fns['dashboard-team']!.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoPowerUser'));

    // DynamoDB Streams -> notification-worker
    fns['notification-worker']!.addEventSource(new eventsources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      retryAttempts: 3,
    }));

    // EventBridge cron -> data-pipeline (daily 6 AM UTC = 11 PM AZ time)
    new events.Rule(this, 'DataPipelineCron', {
      schedule: events.Schedule.cron({ minute: '0', hour: '6', day: '*', month: '*', year: '*' }),
      targets: [new targets.LambdaFunction(fns['data-pipeline']!)],
    });

    // API Gateway
    const api = new apigw.RestApi(this, 'Api', {
      restApiName: 'mesahomes-api',
      description: 'MesaHomes public + dashboard REST API',
      deployOptions: { stageName: 'prod', tracingEnabled: true, loggingLevel: apigw.MethodLoggingLevel.INFO },
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://mesahomes.com', 'https://www.mesahomes.com'],
        allowMethods: apigw.Cors.ALL_METHODS,
        allowCredentials: true,
      },
    });
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'JwtAuth', {
      cognitoUserPools: [userPool],
    });

    // Build route tree
    for (const route of ROUTES) {
      const parts = route.path.replace(/^\//, '').split('/');
      let resource: apigw.IResource = api.root;
      for (const part of parts) {
        const existing = resource.getResource(part);
        resource = existing ?? resource.addResource(part);
      }
      const fn = fns[route.lambda];
      if (!fn) throw new Error(`Route ${route.path} references unknown lambda ${route.lambda}`);
      resource.addMethod(route.method, new apigw.LambdaIntegration(fn), {
        authorizationType: route.auth ? apigw.AuthorizationType.COGNITO : apigw.AuthorizationType.NONE,
        authorizer: route.auth ? authorizer : undefined,
      });
    }

    // SES — transactional email for notifications and lead alerts
    // Imports the existing mesahomes.com hosted zone (DNS already delegated)
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: 'Z10182223SPYFYDHCGZH7',
      zoneName: 'mesahomes.com',
    });
    new MesaHomesSesConstruct(this, 'Ses', {
      hostedZone,
      senderLambdas: [
        fns['notification-worker']!,
        fns['listing-service']!,
        fns['leads-capture']!,
        fns['auth-api']!,
      ],
    });

    // Outputs
    new CfnOutput(this, 'ApiUrl', { value: api.url, description: 'API Gateway invoke URL' });
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'TableName', { value: table.tableName });
    new CfnOutput(this, 'DataBucketName', { value: dataBucket.bucketName });
    new CfnOutput(this, 'PhotosBucketName', { value: photosBucket.bucketName });
  }
}
