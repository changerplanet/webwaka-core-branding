import {
  BrandingContext,
  BrandingLayer,
  BrandingSnapshot,
  BrandingSnapshotSchema,
  ResolvedBranding,
} from '../models/branding.js';
import { computeChecksum, generateSnapshotId, canonicalStringify, sha256 } from '../utils/hash.js';
import { resolveBranding } from './resolver.js';

export interface SnapshotVerificationResult {
  valid: boolean;
  errors: string[];
}

export function generateBrandingSnapshot(
  context: BrandingContext,
  layers: BrandingLayer[]
): BrandingSnapshot {
  const generatedAt = new Date().toISOString();
  const resolved = resolveBranding(context, layers);

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

  return snapshot;
}

export function verifyBrandingSnapshot(snapshot: BrandingSnapshot): SnapshotVerificationResult {
  const errors: string[] = [];

  try {
    BrandingSnapshotSchema.parse(snapshot);
  } catch (e) {
    errors.push(`Schema validation failed: ${String(e)}`);
    return { valid: false, errors };
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
    if (new Date() > expiryDate) {
      errors.push('Snapshot has expired');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function resolveFromSnapshot(
  snapshot: BrandingSnapshot,
  evaluationTime?: string
): ResolvedBranding {
  const verification = verifyBrandingSnapshot(snapshot);
  if (!verification.valid) {
    throw new Error(`Invalid snapshot: ${verification.errors.join(', ')}`);
  }

  if (evaluationTime) {
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
  }

  return snapshot.resolved;
}
