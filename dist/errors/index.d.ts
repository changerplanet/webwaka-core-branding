export declare class CrossTenantAccessError extends Error {
    readonly code = "CROSS_TENANT_ACCESS";
    readonly requestedTenantId: string;
    readonly actualTenantId: string;
    constructor(requestedTenantId: string, actualTenantId: string);
}
export declare class SnapshotTenantMismatchError extends Error {
    readonly code = "SNAPSHOT_TENANT_MISMATCH";
    readonly snapshotTenantId: string;
    readonly contextTenantId: string;
    constructor(snapshotTenantId: string, contextTenantId: string);
}
//# sourceMappingURL=index.d.ts.map