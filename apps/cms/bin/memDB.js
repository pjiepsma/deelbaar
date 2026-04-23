import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'path'
import fs from 'fs'
import os from 'node:os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * MongoDB Memory Server data directory (QD-P style: stable path so dev data survives restarts).
 *
 * Resolution order:
 * 1. MONGO_MEMORY_EPHEMERAL=true — fresh OS temp dir each run (CI / throwaway DB).
 * 2. MONGO_MEMORY_PERSIST_PATH set — path relative to process.cwd() (usually apps/cms).
 * 3. Default — apps/cms/bin/storage next to this script (works even if cwd differs).
 *
 * CLEAN_DB=true — delete the chosen storage directory before start (recover from corrupt lock).
 */
const ephemeral = process.env.MONGO_MEMORY_EPHEMERAL === 'true'
const persistPath = (process.env.MONGO_MEMORY_PERSIST_PATH || '').trim()

let storageDir
if (ephemeral) {
  storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deelbaar-cms-mongo-'))
  console.log('Ephemeral MongoDB data directory:', storageDir)
} else if (persistPath) {
  storageDir = path.resolve(process.cwd(), persistPath)
  if (process.env.CLEAN_DB === 'true' && fs.existsSync(storageDir)) {
    try {
      console.log('Cleaning MongoDB storage directory...')
      fs.rmSync(storageDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 })
      console.log('Storage directory cleaned')
    } catch (error) {
      console.warn('Warning: Failed to clean storage directory:', error.message)
      console.warn('Attempting to start MongoDB anyway (will reuse existing data)')
    }
  }
  fs.mkdirSync(storageDir, { recursive: true })
} else {
  storageDir = path.join(__dirname, 'storage')
  if (process.env.CLEAN_DB === 'true' && fs.existsSync(storageDir)) {
    try {
      console.log('Cleaning MongoDB storage directory...')
      fs.rmSync(storageDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 })
      console.log('Storage directory cleaned')
    } catch (error) {
      console.warn('Warning: Failed to clean storage directory:', error.message)
      console.warn('Attempting to start MongoDB anyway (will reuse existing data)')
    }
  }
  fs.mkdirSync(storageDir, { recursive: true })
  console.log('Persistent MongoDB data directory (default):', storageDir)
}

async function startMongoServer() {
  try {
    console.log('Starting MongoDB Memory Server...')
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'payload',
        dbPath: storageDir,
        storageEngine: 'wiredTiger',
      },
    })
    const mongoUri = mongoServer.getUri()
    console.log('✓ MongoDB started successfully')
    console.log('MongoDB URI:', mongoUri)

    process.on('SIGINT', async () => {
      console.log('\nShutting down MongoDB...')
      await mongoServer.stop()
      process.exit(0)
    })
  } catch (error) {
    console.error('Failed to start MongoDB:', error.message)
    console.error('Tip: If you see lock errors, kill all node processes and try again:')
    console.error('  Windows: taskkill /F /IM node.exe')
    console.error('  Mac/Linux: killall node')
    process.exit(1)
  }
}

startMongoServer()
