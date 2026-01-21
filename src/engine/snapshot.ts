import {
  BrandingContext,
  BrandingLayer,
  BrandingSnapshot,
  BrandingSnapshotSchema,
  ResolvedBranding,
} from '../models/branding.js';
import { computeChecksum, generateSnapshotId } from '../utils/hash.js';
import { deepFreeze } from '../utils/freeze.js';
import { resolveBranding } from './resolver.js';
import { SnapshotTenantMismatchError } from '../errors/index.js';

export interface SnapshotVerificationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function generateBrandingSnapshot(
  context: BrandingContext,
  layers: readonly BrandingLayer[]
): Readonly<BrandingSnapshot> {
  if (!context.evaluationTime) {
    throw new Error('evaluationTime is required in context for deterministic snapshot generation');
  }

  const generatedAt = context.evaluationTime;
  const resolved = resolveBranding(context, layers as BrandingLayer[]);

  const layerIds = layers.map((l) => l.id);

  const snapshotData = {
    version: '1.0' as const,
    context,
    resolved,
    layerIds,
    generatedAt,
  };

  const checksum = computeChecksum(snapshotData);
  const snapshotId = generateSnapshotId(context, generatedAt);

  const snapshot: BrandingSnapshot = {
    snapshotId,
    ...snapshotData,
    checksum,
  };

  return deepFreeze(snapshot);
}

export function verifyBrandingSnapshot(
  snapshot: BrandingSnapshot,
  evaluationTime: string
): Readonly<SnapshotVerificationResult> {
  const errors: string[] = [];

  try {
    BrandingSnapshotSchema.parse(snapshot);
  } catch (e) {
    errors.push(`Schema validation failed: ${String(e)}`);
    return deepFreeze({ valid: false, errors });
  }

  const { checksum, snapshotId, expiresAt, ...snapshotData } = snapshot;
  const computedChecksum = computeChecksum(snapshotData);

  if (computedChecksum !== checksum) {
    errors.push('Checksum mismatch: snapshot has been tampered with');
  }

  const expectedSnapshotId = generateSnapshotId(snapshot.context, snapshot.generatedAt);
  if (expectedSnapshotId !== snapshotId) {
    errors.push('Snapshot ID mismatch: snapshot metadata has been modified');
  }

  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    const evalDate = new Date(evaluationTime);
    if (evalDate > expiryDate) {
      errors.push('Snapshot has expired');
    }
  }

  return deepFreeze({
    valid: errors.length === 0,
    errors,
  });
}

export function resolveFromSnapshot(
  snapshot: BrandingSnapshot,
  evaluationTime: string,
  contextTenantId?: string
): Readonly<ResolvedBranding> {
  const verification = verifyBrandingSnapshot(snapshot, evaluationTime);
  if (!verification.valid) {
    throw new Error(`Invalid snapshot: ${verification.errors.join(', ')}`);
  }

  if (contextTenantId && contextTenantId !== snapshot.context.tenantId) {
    throw new SnapshotTenantMismatchError(snapshot.context.tenantId, contextTenantId);
  }

  const evalTime = new Date(evaluationTime);
  const snapshotTime = new Date(snapshot.generatedAt);

  if (evalTime < snapshotTime) {
    throw new Error('Evaluation time cannot be before snapshot generation time');
  }

  if (snapshot.expiresAt) {
    const expiryTime = new Date(snapshot.expiresAt);
    if (evalTime > expiryTime) {
      throw new Error('Snapshot has expired for the given evaluation time');
    }
  }

  return deepFreeze(snapshot.resolved);
}
