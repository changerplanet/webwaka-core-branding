import { describe, it, expect } from 'vitest';
import {
  resolveBranding,
  generateBrandingSnapshot,
  verifyBrandingSnapshot,
  resolveFromSnapshot,
  BrandingContext,
  BrandingLayer,
  BrandingSnapshot,
  CrossTenantAccessError,
  SnapshotTenantMismatchError,
  deepFreeze,
} from '../index.js';

const createUUID = () => crypto.randomUUID();

const baseContext: BrandingContext = {
  tenantId: '550e8400-e29b-41d4-a716-446655440001',
  partnerId: '550e8400-e29b-41d4-a716-446655440002',
  suiteId: 'pos',
  componentId: 'checkout',
  evaluationTime: '2024-06-15T12:00:00.000Z',
};

function createLayer(overrides: Partial<BrandingLayer>): BrandingLayer {
  return {
    id: createUUID(),
    definitionId: createUUID(),
    level: 'system',
    priority: 0,
    tokens: {},
    enabled: true,
    ...overrides,
  };
}

describe('Branding Engine', () => {
  describe('Determinism Tests', () => {
    it('produces identical output for identical input across 10+ runs', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: context.tenantId,
          tokens: { 'color.primary': '#FF0000' },
        }),
      ];

      const results: string[] = [];
      for (let i = 0; i < 15; i++) {
        const resolved = resolveBranding(context, layers);
        results.push(JSON.stringify(resolved));
      }

      const firstResult = results[0];
      for (const result of results) {
        expect(result).toBe(firstResult);
      }
    });

    it('snapshot generation is deterministic with fixed timestamp', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const snapshot1 = generateBrandingSnapshot(context, layers);
      const snapshot2 = generateBrandingSnapshot(context, layers);

      expect(snapshot1.resolved).toEqual(snapshot2.resolved);
      expect(snapshot1.context).toEqual(snapshot2.context);
      expect(snapshot1.snapshotId).toBe(snapshot2.snapshotId);
      expect(snapshot1.checksum).toBe(snapshot2.checksum);
      expect(snapshot1.generatedAt).toBe(snapshot2.generatedAt);
    });

    it('requires evaluationTime for deterministic resolution', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      expect(() => resolveBranding(context, layers)).toThrow('evaluationTime is required');
    });

    it('requires evaluationTime for deterministic snapshot generation', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      expect(() => generateBrandingSnapshot(context, layers)).toThrow('evaluationTime is required');
    });
  });

  describe('Hierarchy Precedence Enforcement', () => {
    it('applies hierarchy in correct order: system < partner < tenant < suite < component < contextual', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        partnerId: '550e8400-e29b-41d4-a716-446655440002',
        suiteId: 'pos',
        componentId: 'checkout',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const systemId = '550e8400-e29b-41d4-a716-446655440010';
      const partnerId = '550e8400-e29b-41d4-a716-446655440011';
      const tenantId = '550e8400-e29b-41d4-a716-446655440012';
      const suiteId = '550e8400-e29b-41d4-a716-446655440013';
      const componentId = '550e8400-e29b-41d4-a716-446655440014';
      const contextualId = '550e8400-e29b-41d4-a716-446655440015';

      const layers: BrandingLayer[] = [
        createLayer({ id: systemId, level: 'system', tokens: { 'test.token': 'system' } }),
        createLayer({ id: partnerId, level: 'partner', partnerId: context.partnerId, tokens: { 'test.token': 'partner' } }),
        createLayer({ id: tenantId, level: 'tenant', tenantId: context.tenantId, tokens: { 'test.token': 'tenant' } }),
        createLayer({ id: suiteId, level: 'suite', suiteId: context.suiteId, tokens: { 'test.token': 'suite' } }),
        createLayer({ id: componentId, level: 'component', componentId: context.componentId, tokens: { 'test.token': 'component' } }),
        createLayer({ id: contextualId, level: 'contextual', tokens: { 'test.token': 'contextual' } }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['test.token'].value).toBe('contextual');
      expect(resolved.tokens['test.token'].sourceLevel).toBe('contextual');
    });

    it('lower hierarchy level wins when higher level is absent', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({ id: '550e8400-e29b-41d4-a716-446655440010', level: 'system', tokens: { 'color.primary': '#000000' } }),
        createLayer({ id: '550e8400-e29b-41d4-a716-446655440011', level: 'tenant', tenantId: context.tenantId, tokens: { 'color.primary': '#FF0000' } }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#FF0000');
      expect(resolved.tokens['color.primary'].sourceLevel).toBe('tenant');
    });

    it('respects priority within the same hierarchy level', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({ id: '550e8400-e29b-41d4-a716-446655440010', level: 'tenant', tenantId: context.tenantId, priority: 1, tokens: { 'color.primary': '#111111' } }),
        createLayer({ id: '550e8400-e29b-41d4-a716-446655440011', level: 'tenant', tenantId: context.tenantId, priority: 2, tokens: { 'color.primary': '#222222' } }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#222222');
    });
  });

  describe('Time-bound Layer Expiry', () => {
    it('excludes expired layers', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-06-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: context.tenantId,
          tokens: { 'color.primary': '#FF0000' },
          validUntil: '2024-01-01T00:00:00.000Z',
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#000000');
      expect(resolved.appliedLayers).not.toContain('550e8400-e29b-41d4-a716-446655440011');
    });

    it('excludes not-yet-valid layers', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: context.tenantId,
          tokens: { 'color.primary': '#FF0000' },
          validFrom: '2024-12-01T00:00:00.000Z',
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#000000');
    });

    it('includes layers within valid time window', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-06-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: context.tenantId,
          tokens: { 'color.primary': '#FF0000' },
          validFrom: '2024-01-01T00:00:00.000Z',
          validUntil: '2024-12-31T23:59:59.000Z',
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#FF0000');
    });
  });

  describe('Semantic to Primitive Token Resolution', () => {
    it('resolves semantic token references', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: {
            'color.blue.500': '#3B82F6',
            'color.primary': '{color.blue.500}',
          },
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#3B82F6');
      expect(resolved.tokens['color.primary'].resolvedFrom).toBe('color.blue.500');
    });

    it('resolves nested semantic token chains', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: {
            'color.blue.500': '#3B82F6',
            'color.brand': '{color.blue.500}',
            'color.primary': '{color.brand}',
          },
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#3B82F6');
    });
  });

  describe('Snapshot Integrity Verification', () => {
    it('generates valid snapshot with correct checksum', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const snapshot = generateBrandingSnapshot(context, layers);
      const verification = verifyBrandingSnapshot(snapshot);

      expect(verification.valid).toBe(true);
      expect(verification.errors).toHaveLength(0);
    });

    it('detects tampered snapshot data', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const snapshot = generateBrandingSnapshot(context, layers);
      const tamperedSnapshot = {
        ...snapshot,
        resolved: {
          ...snapshot.resolved,
          tokens: {
            ...snapshot.resolved.tokens,
            'color.primary': {
              ...snapshot.resolved.tokens['color.primary'],
              value: '#FFFFFF',
            },
          },
        },
      };

      const verification = verifyBrandingSnapshot(tamperedSnapshot);
      expect(verification.valid).toBe(false);
      expect(verification.errors.some((e) => e.includes('Checksum mismatch'))).toBe(true);
    });

    it('detects modified snapshot ID', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const snapshot = generateBrandingSnapshot(context, layers);
      const tamperedSnapshot = {
        ...snapshot,
        snapshotId: 'tampered-id-12345678901234567890',
      };

      const verification = verifyBrandingSnapshot(tamperedSnapshot);
      expect(verification.valid).toBe(false);
    });
  });

  describe('Offline Snapshot Evaluation Equivalence', () => {
    it('resolveFromSnapshot produces same result as live resolution', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000', 'spacing.sm': '8px' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: context.tenantId,
          tokens: { 'color.primary': '#FF0000' },
        }),
      ];

      const liveResolved = resolveBranding(context, layers);
      const snapshot = generateBrandingSnapshot(context, layers);
      const offlineResolved = resolveFromSnapshot(snapshot);

      expect(offlineResolved.tokens).toEqual(liveResolved.tokens);
      expect(offlineResolved.tenantId).toBe(liveResolved.tenantId);
    });

    it('throws error for invalid snapshot when resolving', () => {
      const invalidSnapshot = {
        snapshotId: 'invalid',
        version: '1.0' as const,
        context: { tenantId: '550e8400-e29b-41d4-a716-446655440001' },
        resolved: {
          contextHash: 'abc',
          tenantId: '550e8400-e29b-41d4-a716-446655440001',
          tokens: {},
          appliedLayers: [],
          resolvedAt: '2024-01-15T12:00:00.000Z',
        },
        layerIds: [],
        generatedAt: '2024-01-15T12:00:00.000Z',
        checksum: 'wrong-checksum',
      } as BrandingSnapshot;

      expect(() => resolveFromSnapshot(invalidSnapshot)).toThrow('Invalid snapshot');
    });
  });

  describe('Tenant Isolation', () => {
    it('does not leak tokens from other tenants', () => {
      const contextTenant1: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const contextTenant2: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440099',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: contextTenant1.tenantId,
          tokens: { 'color.primary': '#FF0000', 'secret.token': 'tenant1-secret' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440012',
          level: 'tenant',
          tenantId: contextTenant2.tenantId,
          tokens: { 'color.primary': '#00FF00' },
        }),
      ];

      const resolved1 = resolveBranding(contextTenant1, layers);
      const resolved2 = resolveBranding(contextTenant2, layers);

      expect(resolved1.tokens['color.primary'].value).toBe('#FF0000');
      expect(resolved1.tokens['secret.token']?.value).toBe('tenant1-secret');

      expect(resolved2.tokens['color.primary'].value).toBe('#00FF00');
      expect(resolved2.tokens['secret.token']).toBeUndefined();
    });

    it('each tenant gets isolated resolved branding', () => {
      const tenants = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ];

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        ...tenants.map((tid, idx) =>
          createLayer({
            id: `550e8400-e29b-41d4-a716-44665544002${idx}`,
            level: 'tenant',
            tenantId: tid,
            tokens: { 'tenant.id': tid, 'color.primary': `#${idx}${idx}${idx}${idx}${idx}${idx}` },
          })
        ),
      ];

      for (const tid of tenants) {
        const context: BrandingContext = {
          tenantId: tid,
          evaluationTime: '2024-01-15T12:00:00.000Z',
        };

        const resolved = resolveBranding(context, layers);
        expect(resolved.tenantId).toBe(tid);
        expect(resolved.tokens['tenant.id']?.value).toBe(tid);
      }
    });

    it('throws SnapshotTenantMismatchError when resolving snapshot for wrong tenant', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const snapshot = generateBrandingSnapshot(context, layers);
      const wrongTenantId = '550e8400-e29b-41d4-a716-446655440099';

      expect(() => resolveFromSnapshot(snapshot, undefined, wrongTenantId)).toThrow(
        SnapshotTenantMismatchError
      );
    });
  });

  describe('Disabled Layers', () => {
    it('excludes disabled layers from resolution', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'tenant',
          tenantId: context.tenantId,
          tokens: { 'color.primary': '#FF0000' },
          enabled: false,
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(resolved.tokens['color.primary'].value).toBe('#000000');
    });
  });

  describe('JSON Serialization Round-Trip', () => {
    it('resolved branding survives JSON round-trip', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: {
            'color.primary': '#000000',
            'spacing.sm': 8,
            'feature.enabled': true,
          },
        }),
      ];

      const resolved = resolveBranding(context, layers);
      const serialized = JSON.stringify(resolved);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(resolved);
      expect(deserialized.contextHash).toBe(resolved.contextHash);
      expect(deserialized.tokens['color.primary'].value).toBe('#000000');
      expect(deserialized.tokens['spacing.sm'].value).toBe(8);
      expect(deserialized.tokens['feature.enabled'].value).toBe(true);
    });

    it('snapshot survives JSON round-trip', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: {
            'color.primary': '#000000',
            'spacing.sm': 8,
            'feature.enabled': true,
          },
        }),
      ];

      const snapshot = generateBrandingSnapshot(context, layers);
      const serialized = JSON.stringify(snapshot);
      const deserialized = JSON.parse(serialized) as BrandingSnapshot;

      expect(deserialized).toEqual(snapshot);
      expect(deserialized.snapshotId).toBe(snapshot.snapshotId);
      expect(deserialized.checksum).toBe(snapshot.checksum);

      const verification = verifyBrandingSnapshot(deserialized);
      expect(verification.valid).toBe(true);
    });

    it('context survives JSON round-trip', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        partnerId: '550e8400-e29b-41d4-a716-446655440002',
        suiteId: 'pos',
        componentId: 'checkout',
        evaluationTime: '2024-01-15T12:00:00.000Z',
        locale: 'en-US',
      };

      const serialized = JSON.stringify(context);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(context);
    });

    it('layer survives JSON round-trip', () => {
      const layer: BrandingLayer = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        definitionId: '550e8400-e29b-41d4-a716-446655440020',
        level: 'tenant',
        priority: 100,
        tokens: {
          'color.primary': '#FF0000',
          'spacing.md': 16,
          'animation.enabled': false,
        },
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.000Z',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        enabled: true,
      };

      const serialized = JSON.stringify(layer);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(layer);
    });
  });

  describe('Deep Freeze / Immutability', () => {
    it('resolved branding is frozen', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const resolved = resolveBranding(context, layers);
      expect(Object.isFrozen(resolved)).toBe(true);
    });

    it('snapshot is frozen', () => {
      const context: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        evaluationTime: '2024-01-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: { 'color.primary': '#000000' },
        }),
      ];

      const snapshot = generateBrandingSnapshot(context, layers);
      expect(Object.isFrozen(snapshot)).toBe(true);
    });

    it('deepFreeze utility freezes nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: [3, 4, { e: 5 }],
        },
      };

      const frozen = deepFreeze(obj);
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.b)).toBe(true);
      expect(Object.isFrozen(frozen.b.d)).toBe(true);
    });
  });

  describe('HARD STOP CONDITION PROOF', () => {
    it('Suite can request branding with context and receive deterministic, verifiable snapshot respecting hierarchy, time bounds, and tenant isolation', () => {
      const suiteContext: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        partnerId: '550e8400-e29b-41d4-a716-446655440002',
        suiteId: 'pos',
        componentId: 'checkout',
        evaluationTime: '2024-06-15T12:00:00.000Z',
      };

      const otherTenantContext: BrandingContext = {
        tenantId: '550e8400-e29b-41d4-a716-446655440099',
        partnerId: '550e8400-e29b-41d4-a716-446655440002',
        suiteId: 'pos',
        componentId: 'checkout',
        evaluationTime: '2024-06-15T12:00:00.000Z',
      };

      const layers: BrandingLayer[] = [
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440010',
          level: 'system',
          tokens: {
            'color.base': '#000000',
            'color.primary': '{color.base}',
            'brand.name': 'WebWaka Platform',
          },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440011',
          level: 'partner',
          partnerId: suiteContext.partnerId,
          tokens: {
            'color.base': '#1A1A1A',
            'brand.name': 'Partner Brand',
          },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440012',
          level: 'tenant',
          tenantId: suiteContext.tenantId,
          tokens: {
            'color.primary': '#FF5500',
            'tenant.secret': 'confidential-data',
          },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440013',
          level: 'tenant',
          tenantId: suiteContext.tenantId,
          tokens: { 'color.expired': '#EXPIRED' },
          validUntil: '2024-01-01T00:00:00.000Z',
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440014',
          level: 'suite',
          suiteId: suiteContext.suiteId,
          tokens: { 'suite.feature': 'enabled' },
        }),
        createLayer({
          id: '550e8400-e29b-41d4-a716-446655440015',
          level: 'component',
          componentId: suiteContext.componentId,
          tokens: { 'component.variant': 'checkout-v2' },
        }),
      ];

      const snapshot = generateBrandingSnapshot(suiteContext, layers);

      expect(snapshot.snapshotId).toBeDefined();
      expect(snapshot.version).toBe('1.0');
      expect(snapshot.checksum).toBeDefined();
      expect(snapshot.checksum.length).toBe(64);

      const verification = verifyBrandingSnapshot(snapshot);
      expect(verification.valid).toBe(true);

      expect(snapshot.resolved.tokens['color.primary'].value).toBe('#FF5500');
      expect(snapshot.resolved.tokens['color.primary'].sourceLevel).toBe('tenant');

      expect(snapshot.resolved.tokens['color.base'].value).toBe('#1A1A1A');
      expect(snapshot.resolved.tokens['brand.name'].value).toBe('Partner Brand');
      expect(snapshot.resolved.tokens['suite.feature'].value).toBe('enabled');
      expect(snapshot.resolved.tokens['component.variant'].value).toBe('checkout-v2');

      expect(snapshot.resolved.tokens['color.expired']).toBeUndefined();

      expect(snapshot.resolved.tokens['tenant.secret'].value).toBe('confidential-data');

      const otherTenantSnapshot = generateBrandingSnapshot(otherTenantContext, layers);
      expect(otherTenantSnapshot.resolved.tokens['tenant.secret']).toBeUndefined();

      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        const s = generateBrandingSnapshot(suiteContext, layers);
        results.push(JSON.stringify(s.resolved));
      }
      const firstResult = results[0];
      for (const result of results) {
        expect(result).toBe(firstResult);
      }

      const offlineResolved = resolveFromSnapshot(snapshot);
      expect(offlineResolved.tokens).toEqual(snapshot.resolved.tokens);
    });
  });
});
