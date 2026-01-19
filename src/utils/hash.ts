import { createHash } from 'crypto';

export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const value = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalStringify(value);
  });

  return '{' + pairs.join(',') + '}';
}

export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

export function generateSnapshotId(context: unknown, timestamp: string): string {
  const data = canonicalStringify({ context, timestamp });
  return sha256(data).substring(0, 32);
}

export function computeChecksum(data: unknown): string {
  return sha256(canonicalStringify(data));
}
