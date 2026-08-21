import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '~/env'
import { seedDemoUser } from '~/lib/translation'
import * as schema from '~/server/db/schema'

const client = postgres(env.DATABASE_URL)
const database = drizzle(client, { schema })

try {
  await seedDemoUser(database)
} finally {
  await client.end()
}
