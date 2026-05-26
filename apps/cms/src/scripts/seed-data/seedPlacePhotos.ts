import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { BasePayload } from 'payload'

export const SEED_PHOTOS_PER_PLACE = 4
export const SEED_MEDIA_ALT_PREFIX = 'seed-place-photo-'

const MEDIA_FILES = ['place-photo-01.jpg', 'place-photo-02.jpg', 'place-photo-03.jpg', 'place-photo-04.jpg'] as const

function seedMediaDirectory(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'media')
}

export async function clearSeedMedia(payload: BasePayload): Promise<void> {
  await payload.delete({
    collection: 'media',
    where: {
      alt: { like: `${SEED_MEDIA_ALT_PREFIX}%` },
    },
  })
}

export async function ensureSeedMediaPool(payload: BasePayload): Promise<number[]> {
  const dir = seedMediaDirectory()
  const ids: number[] = []

  for (const fileName of MEDIA_FILES) {
    const filePath = path.join(dir, fileName)
    if (!existsSync(filePath)) {
      throw new Error(`Missing seed media file: ${filePath}`)
    }
    const data = readFileSync(filePath)
    const alt = `${SEED_MEDIA_ALT_PREFIX}${fileName.replace('place-photo-', '').replace('.jpg', '')}`
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      file: {
        data,
        mimetype: 'image/jpeg',
        name: fileName,
        size: data.length,
      },
      overrideAccess: true,
    })
    ids.push(doc.id)
  }

  return ids
}

export type SeedApprovedPicture = {
  photo: number
  created_by: string | number
  status: 'approved'
  approved_by: string | number
  approved_at: string
}

export function buildApprovedPictures(
  mediaIds: number[],
  ownerId: string | number,
  adminId: string | number,
  count = SEED_PHOTOS_PER_PLACE,
): SeedApprovedPicture[] {
  const approvedAt = new Date().toISOString()
  const pictures: SeedApprovedPicture[] = []

  for (let i = 0; i < count; i += 1) {
    pictures.push({
      photo: mediaIds[i % mediaIds.length]!,
      created_by: ownerId,
      status: 'approved',
      approved_by: adminId,
      approved_at: approvedAt,
    })
  }

  return pictures
}
