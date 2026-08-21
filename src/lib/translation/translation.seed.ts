import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type * as databaseSchema from '~/server/db/schema'

import { TranslationRepository } from './translation.repository'

export async function seedDemoUser(database: PostgresJsDatabase<typeof databaseSchema>) {
  return new TranslationRepository(database).ensureDemoUser()
}
