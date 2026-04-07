import type { Access, AccessArgs } from 'payload'

type Role = 'user' | 'admin'

export const hasRole = (allowedRoles: Role[]): Access => {
  return ({ req: { user } }: AccessArgs) => {
    if (!user) return false
    // Type assertion needed because Payload's user type is UntypedUser
    const typedUser = user as { role?: Role } | null
    if (!typedUser || !typedUser.role) return false
    return allowedRoles.includes(typedUser.role)
  }
}









