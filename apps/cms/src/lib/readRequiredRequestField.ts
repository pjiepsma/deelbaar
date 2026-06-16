function readStringProperty(obj: object, key: string): string | null {
  if (!(key in obj)) {
    return null
  }
  const value: unknown = Reflect.get(obj, key)
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function readRequiredStringField(data: unknown, key: string): string | null {
  if (data === null || typeof data !== 'object') {
    return null
  }
  return readStringProperty(data, key)
}

export function readRequiredIdToken(data: unknown): string | null {
  return readRequiredStringField(data, 'idToken')
}
