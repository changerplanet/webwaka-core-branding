import {
  BrandingContext,
  BrandingLayer,
  ResolvedBranding,
  ResolvedToken,
  getHierarchyPriority,
} from '../models/branding.js';
import { sha256, canonicalStringify } from '../utils/hash.js';
import { deepFreeze } from '../utils/freeze.js';
import { CrossTenantAccessError } from '../errors/index.js';

function isLayerActive(layer: BrandingLayer, evaluationTime: Date): boolean {
  if (!layer.enabled) return false;

  if (layer.validFrom) {
    const validFromDate = new Date(layer.validFrom);
    if (evaluationTime < validFromDate) return false;
  }

  if (layer.validUntil) {
    const validUntilDate = new Date(layer.validUntil);
    if (evaluationTime > validUntilDate) return false;
  }

  return true;
}

function validateTenantAccess(layer: BrandingLayer, context: BrandingContext): void {
  if (layer.level === 'tenant' && layer.tenantId && layer.tenantId !== context.tenantId) {
    throw new CrossTenantAccessError(layer.tenantId, context.tenantId);
  }
}

function isLayerApplicable(layer: BrandingLayer, context: BrandingContext): boolean {
  if (layer.tenantId && layer.tenantId !== context.tenantId) {
    return false;
  }

  if (layer.partnerId && layer.partnerId !== context.partnerId) {
    return false;
  }

  if (layer.suiteId && layer.suiteId !== context.suiteId) {
    return false;
  }

  if (layer.componentId && layer.componentId !== context.componentId) {
    return false;
  }

  return true;
}

function sortLayers(layers: readonly BrandingLayer[]): BrandingLayer[] {
  return [...layers].sort((a, b) => {
    const levelA = getHierarchyPriority(a.level);
    const levelB = getHierarchyPriority(b.level);

    if (levelA !== levelB) {
      return levelA - levelB;
    }

    return a.priority - b.priority;
  });
}

function resolveSemanticTokens(
  tokens: Record<string, ResolvedToken>
): Record<string, ResolvedToken> {
  const resolved = { ...tokens };
  const maxIterations = 10;

  for (let i = 0; i < maxIterations; i++) {
    let hasUnresolved = false;

    for (const [key, token] of Object.entries(resolved)) {
      if (
        typeof token.value === 'string' &&
        token.value.startsWith('{') &&
        token.value.endsWith('}')
      ) {
        const reference = token.value.slice(1, -1);
        const referencedToken = resolved[reference];

        if (referencedToken && referencedToken.value !== token.value) {
          resolved[key] = {
            ...token,
            value: referencedToken.value,
            resolvedFrom: reference,
          };
          hasUnresolved = true;
        }
      }
    }

    if (!hasUnresolved) break;
  }

  return resolved;
}

export function resolveBranding(
  context: BrandingContext,
  layers: readonly BrandingLayer[]
): Readonly<ResolvedBranding> {
  if (!context.evaluationTime) {
    throw new Error('evaluationTime is required in context for deterministic resolution');
  }

  const evaluationTime = new Date(context.evaluationTime);

  const activeLayers = layers.filter(
    (layer) => isLayerActive(layer, evaluationTime) && isLayerApplicable(layer, context)
  );

  const sortedLayers = sortLayers(activeLayers);

  const tokens: Record<string, ResolvedToken> = {};
  const appliedLayers: string[] = [];

  for (const layer of sortedLayers) {
    validateTenantAccess(layer, context);
    appliedLayers.push(layer.id);

    for (const [key, value] of Object.entries(layer.tokens)) {
      tokens[key] = {
        key,
        value,
        sourceLayer: layer.id,
        sourceLevel: layer.level,
      };
    }
  }

  const resolvedTokens = resolveSemanticTokens(tokens);

  const stableTokenKeys = Object.keys(resolvedTokens).sort();
  const stableTokens: Record<string, ResolvedToken> = {};
  for (const key of stableTokenKeys) {
    stableTokens[key] = resolvedTokens[key];
  }

  const contextHash = sha256(canonicalStringify(context));

  const resolved: ResolvedBranding = {
    contextHash,
    tenantId: context.tenantId,
    tokens: stableTokens,
    appliedLayers,
    resolvedAt: evaluationTime.toISOString(),
  };

  return deepFreeze(resolved);
}
