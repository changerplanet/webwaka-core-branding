import { BrandingContext, BrandingLayer, BrandingSnapshot, ResolvedBranding } from '../models/branding.js';
export interface SnapshotVerificationResult {
    readonly valid: boolean;
    readonly errors: readonly string[];
}
export declare function generateBrandingSnapshot(context: BrandingContext, layers: readonly BrandingLayer[]): Readonly<BrandingSnapshot>;
export declare function verifyBrandingSnapshot(snapshot: BrandingSnapshot, evaluationTime: string): Readonly<SnapshotVerificationResult>;
export declare function resolveFromSnapshot(snapshot: BrandingSnapshot, evaluationTime: string, contextTenantId?: string): Readonly<ResolvedBranding>;
//# sourceMappingURL=snapshot.d.ts.map