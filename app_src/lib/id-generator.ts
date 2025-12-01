let idCounter = 0

export function generateId(): string {
    idCounter += 1
    return `eval-${idCounter}-${Date.now()}`
}

export function generateTimestamp(): string {
    return new Date().toISOString()
}
