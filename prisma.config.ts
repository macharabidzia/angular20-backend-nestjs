import path from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import { PrismaConfig } from 'prisma'

dotenvConfig({ path: path.join(process.cwd(), '.env') })

export default {
  schema: path.join(process.cwd(), 'prisma'),
} satisfies PrismaConfig
