/**
 * SES configuration for MesaHomes transactional email.
 *
 * Supports three sending identities:
 *   hello@mesahomes.com       — general inquiries
 *   notifications@mesahomes.com — lead alerts, payment confirmations
 *   noreply@mesahomes.com     — automated system emails
 *
 * Add to the main stack via:
 *   import { MesaHomesSesConstruct } from './ses.js';
 *   new MesaHomesSesConstruct(this, 'Ses', { hostedZone });
 *
 * After `cdk deploy`:
 *   1. SES starts in "sandbox" mode — can only send to verified addresses.
 *      Request production access in AWS console (usually approved in <24h).
 *   2. Verify your personal email as a test recipient until out of sandbox:
 *      aws ses verify-email-identity --email-address you@example.com --profile Msahms --region us-west-2
 *   3. DKIM + SPF + DMARC records auto-created in Route53.
 */
import { Construct } from 'constructs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface MesaHomesSesConstructProps {
  hostedZone: route53.IHostedZone;
  /** Lambdas that need ses:SendEmail permission. */
  senderLambdas: iam.IGrantable[];
}

export class MesaHomesSesConstruct extends Construct {
  public readonly domainIdentity: ses.EmailIdentity;

  constructor(scope: Construct, id: string, props: MesaHomesSesConstructProps) {
    super(scope, id);

    // Domain identity — auto-creates DKIM CNAMEs in Route53
    this.domainIdentity = new ses.EmailIdentity(this, 'DomainIdentity', {
      identity: ses.Identity.publicHostedZone(props.hostedZone),
      mailFromDomain: 'mail.mesahomes.com',
    });

    // Configuration set for tracking bounces / complaints
    const configSet = new ses.ConfigurationSet(this, 'ConfigSet', {
      configurationSetName: 'mesahomes-default',
      reputationMetrics: true,
      suppressionReasons: ses.SuppressionReasons.BOUNCES_AND_COMPLAINTS,
    });

    // SPF record for the mail-from subdomain
    new route53.TxtRecord(this, 'SpfRecord', {
      zone: props.hostedZone,
      recordName: 'mail',
      values: ['v=spf1 include:amazonses.com -all'],
    });

    // SPF for root (safe broad policy; softfail anything else)
    new route53.TxtRecord(this, 'RootSpfRecord', {
      zone: props.hostedZone,
      values: ['v=spf1 include:amazonses.com ~all'],
    });

    // DMARC record (relaxed alignment, quarantine failures, rua for aggregate reports)
    new route53.TxtRecord(this, 'DmarcRecord', {
      zone: props.hostedZone,
      recordName: '_dmarc',
      values: [
        'v=DMARC1; p=quarantine; rua=mailto:dmarc@mesahomes.com; ruf=mailto:dmarc@mesahomes.com; fo=1; adkim=r; aspf=r; pct=100',
      ],
    });

    // Grant SendEmail to the Lambdas that actually send mail
    for (const lambda of props.senderLambdas) {
      lambda.grantPrincipal.addToPrincipalPolicy(new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail', 'ses:SendTemplatedEmail'],
        resources: [
          this.domainIdentity.emailIdentityArn,
          `arn:aws:ses:${(iam as any).Stack?.of?.(this)?.region ?? 'us-west-2'}:*:configuration-set/${configSet.configurationSetName}`,
        ],
      }));
    }
  }
}
