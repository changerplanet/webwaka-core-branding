import { z } from 'zod';
import { TokenSchema } from './tokens.js';
export const HierarchyLevelSchema = z.enum([
    'system',
    'partner',
    'tenant',
    'suite',
    'component',
    'contextual',
]);
export const BrandingDefinitionSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    tokens: z.array(TokenSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const BrandingLayerSchema = z.object({
    id: z.string().uuid(),
    definitionId: z.string().uuid(),
    level: HierarchyLevelSchema,
    priority: z.number().int().min(0).max(1000),
    tokens: z.record(z.string(), z.unknown()),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    tenantId: z.string().uuid().optional(),
    partnerId: z.string().uuid().optional(),
    suiteId: z.string().optional(),
    componentId: z.string().optional(),
    enabled: z.boolean().default(true),
});
export const BrandingContextSchema = z.object({
    tenantId: z.string().uuid(),
    partnerId: z.string().uuid().optional(),
    suiteId: z.string().optional(),
    componentId: z.string().optional(),
    evaluationTime: z.string().datetime().optional(),
    locale: z.string().optional(),
});
export const ResolvedTokenSchema = z.object({
    key: z.string(),
    value: z.unknown(),
    sourceLayer: z.string().uuid(),
    sourceLevel: HierarchyLevelSchema,
    resolvedFrom: z.string().optional(),
});
export const ResolvedBrandingSchema = z.object({
    contextHash: z.string(),
    tenantId: z.string().uuid(),
    tokens: z.record(z.string(), ResolvedTokenSchema),
    appliedLayers: z.array(z.string().uuid()),
    resolvedAt: z.string().datetime(),
});
export const BrandingSnapshotSchema = z.object({
    snapshotId: z.string(),
    version: z.literal('1.0'),
    context: BrandingContextSchema,
    resolved: ResolvedBrandingSchema,
    layerIds: z.array(z.string().uuid()),
    generatedAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
    checksum: z.string(),
});
export const HIERARCHY_ORDER = [
    'system',
    'partner',
    'tenant',
    'suite',
    'component',
    'contextual',
];
export function getHierarchyPriority(level) {
    return HIERARCHY_ORDER.indexOf(level);
}
//# sourceMappingURL=branding.js.map