import { z } from 'zod';
export declare const HierarchyLevelSchema: z.ZodEnum<{
    system: "system";
    partner: "partner";
    tenant: "tenant";
    suite: "suite";
    component: "component";
    contextual: "contextual";
}>;
export declare const BrandingDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tokens: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"primitive">;
        key: z.ZodString;
        value: z.ZodString;
        category: z.ZodEnum<{
            color: "color";
            spacing: "spacing";
            typography: "typography";
            border: "border";
            shadow: "shadow";
            opacity: "opacity";
            duration: "duration";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"semantic">;
        key: z.ZodString;
        reference: z.ZodString;
        category: z.ZodEnum<{
            surface: "surface";
            text: "text";
            accent: "accent";
            feedback: "feedback";
            interactive: "interactive";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"brand">;
        key: z.ZodString;
        value: z.ZodString;
        category: z.ZodEnum<{
            logo: "logo";
            name: "name";
            tagline: "tagline";
            identity: "identity";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"behavioral">;
        key: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        category: z.ZodEnum<{
            animation: "animation";
            interaction: "interaction";
            accessibility: "accessibility";
            locale: "locale";
            feature: "feature";
        }>;
    }, z.core.$strip>], "type">>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const BrandingLayerSchema: z.ZodObject<{
    id: z.ZodString;
    definitionId: z.ZodString;
    level: z.ZodEnum<{
        system: "system";
        partner: "partner";
        tenant: "tenant";
        suite: "suite";
        component: "component";
        contextual: "contextual";
    }>;
    priority: z.ZodNumber;
    tokens: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    validFrom: z.ZodOptional<z.ZodString>;
    validUntil: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodOptional<z.ZodString>;
    partnerId: z.ZodOptional<z.ZodString>;
    suiteId: z.ZodOptional<z.ZodString>;
    componentId: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const BrandingContextSchema: z.ZodObject<{
    tenantId: z.ZodString;
    partnerId: z.ZodOptional<z.ZodString>;
    suiteId: z.ZodOptional<z.ZodString>;
    componentId: z.ZodOptional<z.ZodString>;
    evaluationTime: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ResolvedTokenSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnknown;
    sourceLayer: z.ZodString;
    sourceLevel: z.ZodEnum<{
        system: "system";
        partner: "partner";
        tenant: "tenant";
        suite: "suite";
        component: "component";
        contextual: "contextual";
    }>;
    resolvedFrom: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ResolvedBrandingSchema: z.ZodObject<{
    contextHash: z.ZodString;
    tenantId: z.ZodString;
    tokens: z.ZodRecord<z.ZodString, z.ZodObject<{
        key: z.ZodString;
        value: z.ZodUnknown;
        sourceLayer: z.ZodString;
        sourceLevel: z.ZodEnum<{
            system: "system";
            partner: "partner";
            tenant: "tenant";
            suite: "suite";
            component: "component";
            contextual: "contextual";
        }>;
        resolvedFrom: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    appliedLayers: z.ZodArray<z.ZodString>;
    resolvedAt: z.ZodString;
}, z.core.$strip>;
export declare const BrandingSnapshotSchema: z.ZodObject<{
    snapshotId: z.ZodString;
    version: z.ZodLiteral<"1.0">;
    context: z.ZodObject<{
        tenantId: z.ZodString;
        partnerId: z.ZodOptional<z.ZodString>;
        suiteId: z.ZodOptional<z.ZodString>;
        componentId: z.ZodOptional<z.ZodString>;
        evaluationTime: z.ZodOptional<z.ZodString>;
        locale: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    resolved: z.ZodObject<{
        contextHash: z.ZodString;
        tenantId: z.ZodString;
        tokens: z.ZodRecord<z.ZodString, z.ZodObject<{
            key: z.ZodString;
            value: z.ZodUnknown;
            sourceLayer: z.ZodString;
            sourceLevel: z.ZodEnum<{
                system: "system";
                partner: "partner";
                tenant: "tenant";
                suite: "suite";
                component: "component";
                contextual: "contextual";
            }>;
            resolvedFrom: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        appliedLayers: z.ZodArray<z.ZodString>;
        resolvedAt: z.ZodString;
    }, z.core.$strip>;
    layerIds: z.ZodArray<z.ZodString>;
    generatedAt: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
    checksum: z.ZodString;
}, z.core.$strip>;
export type HierarchyLevel = z.infer<typeof HierarchyLevelSchema>;
export type BrandingDefinition = z.infer<typeof BrandingDefinitionSchema>;
export type BrandingLayer = z.infer<typeof BrandingLayerSchema>;
export type BrandingContext = z.infer<typeof BrandingContextSchema>;
export type ResolvedToken = z.infer<typeof ResolvedTokenSchema>;
export type ResolvedBranding = z.infer<typeof ResolvedBrandingSchema>;
export type BrandingSnapshot = z.infer<typeof BrandingSnapshotSchema>;
export declare const HIERARCHY_ORDER: readonly HierarchyLevel[];
export declare function getHierarchyPriority(level: HierarchyLevel): number;
//# sourceMappingURL=branding.d.ts.map