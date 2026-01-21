export class CrossTenantAccessError extends Error {
  readonly code = 'CROSS_TENANT_ACCESS';
  readonly requestedTenantId: string;
  readonly actualTenantId: string;

  constructor(requestedTenantId: string, actualTenantId: string) {
    super(
      `Cross-tenant access violation: attempted to access tenant '${requestedTenantId}' from context of tenant '${actualTenantId}'`
    );
    this.name = 'CrossTenantAccessError';
    this.requestedTenantId = requestedTenantId;
    this.actualTenantId = actualTenantId;
    Object.freeze(this);
  }
}

export class SnapshotTenantMismatchError extends Error {
  readonly code = 'SNAPSHOT_TENANT_MISMATCH';
  readonly snapshotTenantId: string;
  readonly contextTenantId: string;

  constructor(snapshotTenantId: string, contextTenantId: string) {
    super(
      `Snapshot tenant mismatch: snapshot belongs to tenant '${snapshotTenantId}' but context specifies tenant '${contextTenantId}'`
    );
    this.name = 'SnapshotTenantMismatchError';
    this.snapshotTenantId = snapshotTenantId;
    this.contextTenantId = contextTenantId;
    Object.freeze(this);
  }
}
