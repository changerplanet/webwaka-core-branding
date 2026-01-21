export function deepFreeze(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj !== 'object') {
        return obj;
    }
    if (Object.isFrozen(obj)) {
        return obj;
    }
    Object.freeze(obj);
    if (Array.isArray(obj)) {
        for (const item of obj) {
            deepFreeze(item);
        }
    }
    else {
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (value !== null && typeof value === 'object') {
                deepFreeze(value);
            }
        }
    }
    return obj;
}
//# sourceMappingURL=freeze.js.map