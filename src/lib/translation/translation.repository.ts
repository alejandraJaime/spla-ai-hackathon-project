import { eq, inArray, max, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type * as databaseSchema from '~/server/db/schema'

import { DEMO_USER_ID, DEMO_USER_NAME } from './translation.config'
import { hierarchyVersions, jobs, jobVersions, messages, users } from './translation.schema'
import type {
  AppendHierarchyVersionInput,
  CreateJobInput,
  CreateMessageInput,
  CreatePlanVersionInput,
  ITranslationRepository,
} from './translation.types'

type TranslationDatabase = PostgresJsDatabase<typeof databaseSchema>
type TranslationTransaction = Parameters<Parameters<TranslationDatabase['transaction']>[0]>[0]

export class TranslationRepository implements ITranslationRepository {
  constructor(private readonly database: TranslationDatabase) {}

  async ensureDemoUser() {
    await this.database
      .insert(users)
      .values({ id: DEMO_USER_ID, name: DEMO_USER_NAME })
      .onConflictDoNothing({ target: users.id })

    const [demoUser] = await this.database.select().from(users).where(eq(users.id, DEMO_USER_ID))
    if (!demoUser) {
      throw new Error('The demo user could not be resolved after seeding')
    }

    return demoUser
  }

  async createJob(input: CreateJobInput) {
    const owner = await this.ensureDemoUser()
    const [job] = await this.database
      .insert(jobs)
      .values({ ...input, ownerId: owner.id })
      .returning()
    if (!job) {
      throw new Error('The Job insert did not return a row')
    }

    return job
  }

  async findJobById(id: string) {
    const [job] = await this.database.select().from(jobs).where(eq(jobs.id, id))
    return job ?? null
  }

  async appendHierarchyVersion(input: AppendHierarchyVersionInput) {
    return this.database.transaction(async (transaction) => {
      const versionNumber = await nextVersionNumber(
        transaction,
        `hierarchy:${input.jobId}:${input.campaignType}`,
        async () => {
          const [latest] = await transaction
            .select({ versionNumber: max(hierarchyVersions.versionNumber) })
            .from(hierarchyVersions)
            .where(
              sql`${hierarchyVersions.jobId} = ${input.jobId}
                AND ${hierarchyVersions.campaignType} = ${input.campaignType}`,
            )
          return latest?.versionNumber ?? null
        },
      )

      const [hierarchyVersion] = await transaction
        .insert(hierarchyVersions)
        .values({ ...input, versionNumber })
        .returning()
      if (!hierarchyVersion) {
        throw new Error('The Hierarchy Version insert did not return a row')
      }

      return hierarchyVersion
    })
  }

  async createPlanVersion(input: CreatePlanVersionInput) {
    return this.database.transaction(async (transaction) => {
      const versionNumber = await nextVersionNumber(
        transaction,
        `plan:${input.jobId}`,
        async () => {
          const [latest] = await transaction
            .select({ versionNumber: max(jobVersions.versionNumber) })
            .from(jobVersions)
            .where(eq(jobVersions.jobId, input.jobId))
          return latest?.versionNumber ?? null
        },
      )

      const [planVersion] = await transaction
        .insert(jobVersions)
        .values({ ...input, versionNumber })
        .returning()
      if (!planVersion) {
        throw new Error('The Plan Version insert did not return a row')
      }

      return planVersion
    })
  }

  async resolvePlanVersion(id: string) {
    const [planVersion] = await this.database
      .select()
      .from(jobVersions)
      .where(eq(jobVersions.id, id))
    if (!planVersion) {
      return null
    }

    const hierarchyVersionIds = Object.values(planVersion.pointerMap).filter(
      (hierarchyVersionId): hierarchyVersionId is string => typeof hierarchyVersionId === 'string',
    )
    const resolvedHierarchyVersions =
      hierarchyVersionIds.length === 0
        ? []
        : await this.database
            .select()
            .from(hierarchyVersions)
            .where(inArray(hierarchyVersions.id, hierarchyVersionIds))

    return { planVersion, hierarchyVersions: resolvedHierarchyVersions }
  }

  async createMessage(input: CreateMessageInput) {
    const [message] = await this.database.insert(messages).values(input).returning()
    if (!message) {
      throw new Error('The message insert did not return a row')
    }

    return message
  }

  async findMessageById(id: string) {
    const [message] = await this.database.select().from(messages).where(eq(messages.id, id))
    return message ?? null
  }
}

async function nextVersionNumber(
  transaction: TranslationTransaction,
  lockKey: string,
  readLatest: () => Promise<number | null>,
) {
  await transaction.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`)
  return ((await readLatest()) ?? 0) + 1
}
