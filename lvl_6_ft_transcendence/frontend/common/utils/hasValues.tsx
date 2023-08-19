export function hasValues(object: {}) {
    return object !== undefined && Object.keys(object).length !== 0
}
