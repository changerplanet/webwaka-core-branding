import { z } from 'zod';
export declare const PrimitiveTokenSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const SemanticTokenSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const BrandTokenSchema: z.ZodObject<{
    type: z.ZodLiteral<"brand">;
    key: z.ZodString;
    value: z.ZodString;
    category: z.ZodEnum<{
        logo: "logo";
        name: "name";
        tagline: "tagline";
        identity: "identity";
    }>;
}, z.core.$strip>;
export declare const BehavioralTokenSchema: z.ZodObject<{
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
}, z.core.$strip>;
export declare const TokenSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
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
}, z.core.$strip>], "type">;
export type PrimitiveToken = z.infer<typeof PrimitiveTokenSchema>;
export type SemanticToken = z.infer<typeof SemanticTokenSchema>;
export type BrandToken = z.infer<typeof BrandTokenSchema>;
export type BehavioralToken = z.infer<typeof BehavioralTokenSchema>;
export type Token = z.infer<typeof TokenSchema>;
//# sourceMappingURL=tokens.d.ts.map