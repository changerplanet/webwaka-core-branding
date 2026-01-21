export class CrossTenantAccessError extends Error {
    code = 'CROSS_TENANT_ACCESS';
    requestedTenantId;
    actualTenantId;
    constructor(requestedTenantId, actualTenantId) {
        super(`Cross-tenant access violation: attempted to access tenant '${requestedTenantId}' from context of tenant '${actualTenantId}'`);
        this.name = 'CrossTenantAccessError';
        this.requestedTenantId = requestedTenantId;
        this.actualTenantId = actualTenantId;
        Object.freeze(this);
    }
}
export class SnapshotTenantMismatchError extends Error {
    code = 'SNAPSHOT_TENANT_MISMATCH';
    snapshotTenantId;
    contextTenantId;
    constructor(snapshotTenantId, contextTenantId) {
        super(`Snapshot tenant mismatch: snapshot belongs to tenant '${snapshotTenantId}' but context specifies tenant '${contextTenantId}'`);
        this.name = 'SnapshotTenantMismatchError';
        this.snapshotTenantId = snapshotTenantId;
        this.contextTenantId = contextTenantId;
        Object.freeze(this);
    }
}
//# sourceMappingURL=index.js.map