import { z } from 'zod';

export const PrimitiveTokenSchema = z.object({
  type: z.literal('primitive'),
  key: z.string().min(1),
  value: z.string(),
  category: z.enum(['color', 'spacing', 'typography', 'border', 'shadow', 'opacity', 'duration']),
});

export const SemanticTokenSchema = z.object({
  type: z.literal('semantic'),
  key: z.string().min(1),
  reference: z.string().min(1),
  category: z.enum(['surface', 'text', 'accent', 'feedback', 'interactive']),
});

export const BrandTokenSchema = z.object({
  type: z.literal('brand'),
  key: z.string().min(1),
  value: z.string(),
  category: z.enum(['logo', 'name', 'tagline', 'identity']),
});

export const BehavioralTokenSchema = z.object({
  type: z.literal('behavioral'),
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  category: z.enum(['animation', 'interaction', 'accessibility', 'locale', 'feature']),
});

export const TokenSchema = z.discriminatedUnion('type', [
  PrimitiveTokenSchema,
  SemanticTokenSchema,
  BrandTokenSchema,
  BehavioralTokenSchema,
]);

export type PrimitiveToken = z.infer<typeof PrimitiveTokenSchema>;
export type SemanticToken = z.infer<typeof SemanticTokenSchema>;
export type BrandToken = z.infer<typeof BrandTokenSchema>;
export type BehavioralToken = z.infer<typeof BehavioralTokenSchema>;
export type Token = z.infer<typeof TokenSchema>;
