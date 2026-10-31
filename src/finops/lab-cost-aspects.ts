import { Annotations, AspectPriority, Aspects, CfnResource, type IAspect, Stack, Token } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { IConstruct } from 'constructs';
import { assertRange } from '../core/validation';

/**
 * CloudFormation resource types that have a fixed hourly or monthly price, even when they carry no traffic.
 *
 * `FixedCostWarningAspect` adds a warning to each resource whose type is in this list.
 */
export const FIXED_COST_RESOURCE_TYPES: readonly string[] = [
  'AWS::EC2::NatGateway',
  'AWS::EC2::EIP',
  'AWS::ElasticLoadBalancingV2::LoadBalancer',
  'AWS::ElasticLoadBalancing::LoadBalancer',
  'AWS::EKS::Cluster',
  'AWS::KMS::Key',
  'AWS::SecretsManager::Secret',
  'AWS::RDS::DBInstance',
  'AWS::RDS::DBCluster',
  'AWS::ElastiCache::CacheCluster',
  'AWS::ElastiCache::ReplicationGroup',
  'AWS::OpenSearchService::Domain',
  'AWS::MSK::Cluster',
  'AWS::Kinesis::Stream',
  'AWS::GlobalAccelerator::Accelerator',
  'AWS::EC2::TransitGateway',
  'AWS::EC2::VPNConnection',
  'AWS::NetworkFirewall::Firewall',
  'AWS::Redshift::Cluster',
];

/**
 * Options of the `S3LifecycleAspect` aspect.
 */
export interface S3LifecycleAspectOptions {
  /**
   * The number of days after which an incomplete multipart upload is aborted. Must be between 1 and 3650 when applied through `LabCostAspects`.
   *
   * @default 1
   */
  readonly abortIncompleteUploadDays?: number;

  /**
   * The number of days after which a noncurrent object version is expired on versioned buckets. Must be between 1 and 3650 when applied through `LabCostAspects`.
   *
   * @default 7
   */
  readonly noncurrentVersionDays?: number;
}

/**
 * Options of `LabCostAspects.applyTo`.
 */
export interface LabCostAspectsOptions {
  /**
   * The retention applied to log groups that have none, and the longest retention accepted without a warning.
   *
   * @default logs.RetentionDays.THREE_DAYS
   */
  readonly logRetention?: logs.RetentionDays;

  /**
   * The number of days after which an incomplete multipart upload is aborted. Must be between 1 and 3650.
   *
   * @default 1
   */
  readonly abortIncompleteUploadDays?: number;

  /**
   * The number of days after which a noncurrent object version is expired on versioned buckets. Must be between 1 and 3650.
   *
   * @default 7
   */
  readonly noncurrentVersionDays?: number;

  /**
   * Whether a warning is added to each resource type listed in `FIXED_COST_RESOURCE_TYPES`.
   *
   * @default true
   */
  readonly fixedCostWarnings?: boolean;
}

/**
 * Sets a finite retention on log groups that have none, and warns when a log group keeps logs longer than the lab default.
 */
export class LogRetentionAspect implements IAspect {
  private readonly retention: logs.RetentionDays;

  /**
   * @param retention the retention applied to log groups without one, and the longest retention accepted without a warning
   * @default logs.RetentionDays.THREE_DAYS
   */
  constructor(retention: logs.RetentionDays = logs.RetentionDays.THREE_DAYS) {
    this.retention = retention;
  }

  /**
   * Applies the retention to a `logs.CfnLogGroup`. Log groups whose retention is an unresolved token are left unchanged.
   *
   * @param node the construct visited by the aspect
   */
  public visit(node: IConstruct): void {
    if (!(node instanceof logs.CfnLogGroup)) {
      return;
    }
    const days = node.retentionInDays;
    if (days === undefined) {
      node.retentionInDays = this.retention;
      return;
    }
    if (Token.isUnresolved(days)) {
      return;
    }
    if (days > this.retention) {
      Annotations.of(node).addWarningV2(
        'cdk-constructless:log-retention',
        `Log group keeps logs for ${days} days; lab default is ${this.retention}`,
      );
    }
  }
}

/**
 * Adds an abort rule for incomplete multipart uploads to every bucket, and a noncurrent version rule to versioned buckets.
 *
 * Existing lifecycle rules are kept. A rule is not added when a rule of the same kind already exists.
 */
export class S3LifecycleAspect implements IAspect {
  private readonly abortIncompleteUploadDays: number;
  private readonly noncurrentVersionDays: number;

  /**
   * @param options the day counts of the two rules
   */
  constructor(options: S3LifecycleAspectOptions = {}) {
    this.abortIncompleteUploadDays = options.abortIncompleteUploadDays ?? 1;
    this.noncurrentVersionDays = options.noncurrentVersionDays ?? 7;
  }

  /**
   * Appends the lab cleanup rules to a `s3.CfnBucket`. A bucket whose lifecycle configuration or rules are unresolved gets the warning `cdk-constructless:s3-lifecycle-unresolvable` instead.
   *
   * @param node the construct visited by the aspect
   */
  public visit(node: IConstruct): void {
    if (!(node instanceof s3.CfnBucket)) {
      return;
    }
    // L2 buckets store lifecycle and versioning as lazy values, even when they have no rules, so they are resolved first.
    const config = resolveValue<s3.CfnBucket.LifecycleConfigurationProperty>(node, node.lifecycleConfiguration);
    if (Token.isUnresolved(config)) {
      this.warnUnresolved(node);
      return;
    }
    const rules = config?.rules ?? [];
    if (Token.isUnresolved(rules)) {
      this.warnUnresolved(node);
      return;
    }
    const existing = rules as s3.CfnBucket.RuleProperty[];

    const added: s3.CfnBucket.RuleProperty[] = [];
    if (!existing.some((rule) => rule.abortIncompleteMultipartUpload !== undefined)) {
      added.push({
        id: 'LabAbortIncompleteMultipartUpload',
        status: 'Enabled',
        abortIncompleteMultipartUpload: { daysAfterInitiation: this.abortIncompleteUploadDays },
      });
    }
    const versioning = resolveValue<s3.CfnBucket.VersioningConfigurationProperty>(node, node.versioningConfiguration);
    if (versioning?.status === 'Enabled' && !existing.some((rule) => rule.noncurrentVersionExpiration !== undefined)) {
      added.push({
        id: 'LabNoncurrentVersionExpiration',
        status: 'Enabled',
        noncurrentVersionExpiration: { noncurrentDays: this.noncurrentVersionDays },
      });
    }
    if (added.length === 0) {
      return;
    }
    node.lifecycleConfiguration = { ...config, rules: [...existing, ...added] };
  }

  private warnUnresolved(node: s3.CfnBucket): void {
    Annotations.of(node).addWarningV2(
      'cdk-constructless:s3-lifecycle-unresolvable',
      'Bucket lifecycle configuration is unresolved; lab cleanup rules were not added',
    );
  }
}

/**
 * Resolves a lazy CloudFormation property value of a resource to its plain value.
 *
 * @param node the resource that owns the value, used to resolve it
 * @param value the property value, possibly a token
 * @returns the resolved value, or `undefined` when the value is absent or resolves to nothing
 */
function resolveValue<T>(node: CfnResource, value: unknown): T | undefined {
  return value === undefined ? undefined : (Stack.of(node).resolve(value) as T | undefined);
}

/**
 * Adds a warning to each resource whose type has a fixed hourly or monthly price (see `FIXED_COST_RESOURCE_TYPES`).
 */
export class FixedCostWarningAspect implements IAspect {
  /**
   * Adds the warning `cdk-constructless:fixed-cost` to a fixed-cost resource.
   *
   * @param node the construct visited by the aspect
   */
  public visit(node: IConstruct): void {
    if (!(node instanceof CfnResource)) {
      return;
    }
    if (!FIXED_COST_RESOURCE_TYPES.includes(node.cfnResourceType)) {
      return;
    }
    Annotations.of(node).addWarningV2(
      'cdk-constructless:fixed-cost',
      `${node.cfnResourceType} has a fixed hourly or monthly price; remove it from lab stacks when idle`,
    );
  }
}

/**
 * Applies the lab cost controls to a whole scope: log retention, S3 cleanup rules and fixed-cost warnings.
 */
export class LabCostAspects {
  /**
   * Adds `LogRetentionAspect`, `S3LifecycleAspect` and (unless disabled) `FixedCostWarningAspect` to `scope` as mutating aspects.
   *
   * @param scope the construct whose subtree receives the aspects
   * @param options the day counts, log retention and warning switch; see `LabCostAspectsOptions`
   * @throws {ConstructValidationError} `abortIncompleteUploadDays must be between 1 and 3650, got ${value}` when the value is outside the range
   * @throws {ConstructValidationError} `noncurrentVersionDays must be between 1 and 3650, got ${value}` when the value is outside the range
   */
  public static applyTo(scope: IConstruct, options: LabCostAspectsOptions = {}): void {
    const abortIncompleteUploadDays = options.abortIncompleteUploadDays ?? 1;
    const noncurrentVersionDays = options.noncurrentVersionDays ?? 7;
    assertRange(scope, 'abortIncompleteUploadDays', abortIncompleteUploadDays, 1, 3650);
    assertRange(scope, 'noncurrentVersionDays', noncurrentVersionDays, 1, 3650);

    const aspects: IAspect[] = [
      new LogRetentionAspect(options.logRetention),
      new S3LifecycleAspect({ abortIncompleteUploadDays, noncurrentVersionDays }),
    ];
    if (options.fixedCostWarnings ?? true) {
      aspects.push(new FixedCostWarningAspect());
    }
    for (const aspect of aspects) {
      Aspects.of(scope).add(aspect, { priority: AspectPriority.MUTATING });
    }
  }
}
