import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'path'
import fs from 'fs'
import os from 'node:os'

/**
 * MongoDB Memory Server data directory.
 *
 * Default: unique folder under the OS temp dir each run → no stale `mongod.lock`
 * when a previous Node process died or when two terminals tried the same path.
 *
 * Optional: set `MONGO_MEMORY_PERSIST_PATH` (path relative to `apps/cms` cwd, e.g.
 * `bin/storage`) to reuse one DB folder. Use a single dev instance only; run
 * with `CLEAN_DB=true` if the lock file is stuck after a crash.
 */
const persistPath = (process.env.MONGO_MEMORY_PERSIST_PATH || '').trim()
let storageDir
if (persistPath) {
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
  storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deelbaar-cms-mongo-'))
  console.log('Ephemeral MongoDB data directory:', storageDir)
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
    
    // Graceful shutdown
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