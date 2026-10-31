import {
  Annotations,
  AspectPriority,
  Aspects,
  CfnResource,
  type IAspect,
  RemovalPolicy,
  Stack,
  type StackProps,
  Tags,
  Token,
} from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct, IConstruct } from 'constructs';
import { ConstructValidationError } from '../core/errors';
import { LabCostAspects } from './lab-cost-aspects';

const EXPIRES_AT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Properties of the `LabStack` stack.
 */
export interface LabStackProps extends StackProps {
  /**
   * The project name, written to the `Project` tag of every resource.
   *
   * @default none (required)
   */
  readonly project: string;

  /**
   * The owner of the lab, written to the `Owner` tag of every resource. Use an e-mail address or a team name.
   *
   * @default none (required)
   */
  readonly owner: string;

  /**
   * The date after which the lab may be destroyed, written to the `ExpiresAt` tag of every resource. Must be a `YYYY-MM-DD` date.
   *
   * @default none (no `ExpiresAt` tag is written)
   */
  readonly expiresAt?: string;

  /**
   * The construct paths whose resources keep their removal policy. A resource is retained when its `node.path` starts with one of these paths.
   *
   * @default [] (every resource is destroyed with the stack)
   */
  readonly retainedConstructPaths?: string[];

  /**
   * The lab cost controls applied to the whole stack; see `LabCostAspectsOptions`.
   *
   * @default {} (the defaults of `LabCostAspects.applyTo`)
   */
  readonly costAspects?: Parameters<typeof LabCostAspects.applyTo>[1];
}

/**
 * A destroy-by-default stack for throwaway labs.
 *
 * Every resource gets the `Project`, `Env=lab` and `Owner` tags, and the `ExpiresAt` tag when `expiresAt` is set, so a janitor can read `ExpiresAt` and clean up expired labs.
 * Every `CfnResource` gets `RemovalPolicy.DESTROY` unless its path is listed in `retainedConstructPaths`, and RDS instances and clusters get deletion protection turned off.
 * `removalPolicy` SNAPSHOT is not used on RDS because it leaves a billable snapshot after `cdk destroy`; DESTROY avoids that.
 * Synthesis fails for an `s3.Bucket` without `autoDeleteObjects: true`, because a non-empty bucket cannot be deleted.
 * The lab cost controls of `LabCostAspects` are applied to the whole stack.
 */
export class LabStack extends Stack {
  /**
   * @param scope the parent of the stack
   * @param id the construct id of the stack
   * @param props the project, owner, expiry, retention and cost settings; see `LabStackProps`
   * @throws {ConstructValidationError} `expiresAt must be a YYYY-MM-DD date, got "${expiresAt}"` when `expiresAt` is set and is not a `YYYY-MM-DD` date
   */
  constructor(scope: Construct, id: string, props: LabStackProps) {
    super(scope, id, props);

    const { project, owner, expiresAt, retainedConstructPaths = [], costAspects } = props;
    if (expiresAt !== undefined && !Token.isUnresolved(expiresAt) && !EXPIRES_AT_PATTERN.test(expiresAt)) {
      throw new ConstructValidationError(this, `expiresAt must be a YYYY-MM-DD date, got "${expiresAt}"`);
    }

    Tags.of(this).add('Project', project);
    Tags.of(this).add('Env', 'lab');
    Tags.of(this).add('Owner', owner);
    if (expiresAt !== undefined) {
      Tags.of(this).add('ExpiresAt', expiresAt);
    }

    LabCostAspects.applyTo(this, costAspects);
    Aspects.of(this).add(new LabRemovalAspect(retainedConstructPaths), { priority: AspectPriority.MUTATING });
    Aspects.of(this).add(new LabBucketAspect(), { priority: AspectPriority.READONLY });
  }
}

/**
 * Sets `RemovalPolicy.DESTROY` on every resource of a lab stack that is not retained, and turns off RDS deletion protection.
 */
export class LabRemovalAspect implements IAspect {
  private readonly retainedConstructPaths: readonly string[];

  /**
   * @param retainedConstructPaths the construct paths whose resources keep their removal policy
   * @default [] (every resource is destroyed)
   */
  constructor(retainedConstructPaths: readonly string[] = []) {
    this.retainedConstructPaths = retainedConstructPaths;
  }

  /**
   * Applies `RemovalPolicy.DESTROY` to a `CfnResource` whose path is not retained, and sets `deletionProtection` to false on an `rds.CfnDBInstance` or `rds.CfnDBCluster`.
   *
   * @param node the construct visited by the aspect
   */
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource && !this.retainedConstructPaths.some((path) => node.node.path.startsWith(path))) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
    if (node instanceof rds.CfnDBInstance || node instanceof rds.CfnDBCluster) {
      node.deletionProtection = false;
    }
  }
}

/**
 * Adds an error to each `s3.Bucket` of a lab stack that has no auto delete custom resource.
 *
 * An aspect cannot add `autoDeleteObjects` after construction, so the error asks the author to set it in the bucket props.
 */
export class LabBucketAspect implements IAspect {
  /**
   * Adds the error `cdk-constructless:lab-bucket-auto-delete` to an `s3.Bucket` without an `AutoDeleteObjectsCustomResource` child.
   *
   * @param node the construct visited by the aspect
   */
  public visit(node: IConstruct): void {
    if (!(node instanceof s3.Bucket)) {
      return;
    }
    if (node.node.tryFindChild('AutoDeleteObjectsCustomResource') !== undefined) {
      return;
    }
    Annotations.of(node).addError(
      'cdk-constructless:lab-bucket-auto-delete: set autoDeleteObjects: true on lab buckets; an aspect cannot add it after construction',
    );
  }
}
