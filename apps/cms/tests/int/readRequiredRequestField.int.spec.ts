import { describe, expect, it } from 'vitest'

import {
  readRequiredIdToken,
  readRequiredStringField,
} from '@/lib/readRequiredRequestField'

describe('readRequiredRequestField', () => {
  it('returns trimmed idToken from object', () => {
    expect(readRequiredIdToken({ idToken: '  abc  ' })).toBe('abc')
  })

  it('returns null when idToken is missing', () => {
    expect(readRequiredIdToken({})).toBeNull()
  })

  it('returns null when idToken is wrong type', () => {
    expect(readRequiredIdToken({ idToken: 123 })).toBeNull()
  })

  it('returns null when idToken is empty after trim', () => {
    expect(readRequiredIdToken({ idToken: '   ' })).toBeNull()
  })

  it('returns null for non-object data', () => {
    expect(readRequiredStringField(null, 'idToken')).toBeNull()
    expect(readRequiredStringField('token', 'idToken')).toBeNull()
  })
})
