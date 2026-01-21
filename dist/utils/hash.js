import { createHash } from 'crypto';
export function canonicalStringify(obj) {
    if (obj === null || obj === undefined) {
        return JSON.stringify(obj);
    }
    if (typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalStringify).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((key) => {
        const value = obj[key];
        return JSON.stringify(key) + ':' + canonicalStringify(value);
    });
    return '{' + pairs.join(',') + '}';
}
export function sha256(data) {
    return createHash('sha256').update(data, 'utf8').digest('hex');
}
export function generateSnapshotId(context, timestamp) {
    const data = canonicalStringify({ context, timestamp });
    return sha256(data).substring(0, 32);
}
export function computeChecksum(data) {
    return sha256(canonicalStringify(data));
}
//# sourceMappingURL=hash.js.map