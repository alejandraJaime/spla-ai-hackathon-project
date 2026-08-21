import { count, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '~/server/db/schema'

import { splitByCampaignType } from '../hierarchy/hierarchy.split'
import { DEMO_USER_ID } from '../translation.config'
import { TranslationRepository } from '../translation.repository'
import { jobs, users } from '../translation.schema'
import { VALID_HIERARCHY, VALID_PLAN } from './fixtures'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run the translation persistence tests')
}

const client = postgres(connectionString)
const database = drizzle(client, { schema })
const repository = new TranslationRepository(database)

beforeEach(async () => {
  await database.delete(jobs)
  await database.delete(users)
})

afterAll(async () => {
  await database.delete(jobs)
  await database.delete(users)
  await client.end()
})

async function createJob() {
  return repository.createJob({
    platform: 'CM360',
    sourceFileRef: 'media-plan.xlsx',
    modelId: 'test/model-v1',
    plan: VALID_PLAN,
  })
}

test('seeding twice leaves exactly one demo user', async () => {
  const first = await repository.ensureDemoUser()
  const second = await repository.ensureDemoUser()

  const [result] = await database
    .select({ value: count() })
    .from(users)
    .where(eq(users.id, first.id))

  expect(second.id).toBe(first.id)
  expect(result?.value).toBe(1)
})

test('a Job round-trips its platform, model id, and Plan', async () => {
  const created = await createJob()

  const found = await repository.findJobById(created.id)

  expect(found).toMatchObject({
    ownerId: DEMO_USER_ID,
    platform: 'CM360',
    modelId: 'test/model-v1',
    plan: VALID_PLAN,
  })
})

test('Hierarchy Version numbers advance independently per Campaign Type', async () => {
  const job = await createJob()
  const [displayHierarchy, trackingHierarchy] = splitByCampaignType(VALID_HIERARCHY)
  if (!displayHierarchy || !trackingHierarchy) {
    throw new Error('Expected the fixture to split into Display and Standard Tracking')
  }

  const displayV1 = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Display',
    hierarchy: displayHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: null,
  })
  const displayV2 = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Display',
    hierarchy: displayHierarchy,
    status: 'needs_clarification',
    validationErrors: [
      {
        code: 'SIZE_NOT_IN_DICTIONARY',
        invariant: 6,
        entityType: 'placement',
        entityId: 'plc_1',
        message: 'The placement size is not in the field dictionary.',
      },
    ],
    changeSummary: 'Kept the Display hierarchy for clarification.',
  })
  const trackingV1 = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Standard Tracking',
    hierarchy: trackingHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: 'Added tracking.',
  })

  expect([displayV1.versionNumber, displayV2.versionNumber, trackingV1.versionNumber]).toEqual([
    1, 2, 1,
  ])
  expect(displayV2).toMatchObject({
    campaignType: 'Display',
    status: 'needs_clarification',
    changeSummary: 'Kept the Display hierarchy for clarification.',
    hierarchy: { campaigns: [{ campaignType: 'Display' }] },
    validationErrors: [{ code: 'SIZE_NOT_IN_DICTIONARY' }],
  })
  expect(displayV2.hierarchy.campaigns).toHaveLength(1)
})

test('a Plan Version resolves current and prior Hierarchy Version pointers', async () => {
  const job = await createJob()
  const [displayHierarchy, trackingHierarchy] = splitByCampaignType(VALID_HIERARCHY)
  if (!displayHierarchy || !trackingHierarchy) {
    throw new Error('Expected the fixture to split into Display and Standard Tracking')
  }

  const displayV1 = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Display',
    hierarchy: displayHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: null,
  })
  const trackingV1 = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Standard Tracking',
    hierarchy: trackingHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: null,
  })
  await repository.createPlanVersion({
    jobId: job.id,
    messageId: null,
    pointerMap: {
      Display: displayV1.id,
      'Standard Tracking': trackingV1.id,
    },
  })

  const message = await repository.createMessage({
    jobId: job.id,
    role: 'user',
    content: 'Update Display only.',
    resultingVersionIds: [],
  })
  const displayV2 = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Display',
    hierarchy: displayHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: 'Updated Display only.',
  })
  const planV2 = await repository.createPlanVersion({
    jobId: job.id,
    messageId: message.id,
    pointerMap: {
      Display: displayV2.id,
      'Standard Tracking': trackingV1.id,
    },
  })

  const resolved = await repository.resolvePlanVersion(planV2.id)

  expect(planV2.versionNumber).toBe(2)
  expect(resolved?.hierarchyVersions.map(({ id }) => id).sort()).toEqual(
    [displayV2.id, trackingV1.id].sort(),
  )
  expect(resolved?.planVersion.pointerMap).toEqual({
    Display: displayV2.id,
    'Standard Tracking': trackingV1.id,
  })
})

test('messages persist zero, one, and many resulting Hierarchy Version ids', async () => {
  const job = await createJob()
  const [displayHierarchy, trackingHierarchy] = splitByCampaignType(VALID_HIERARCHY)
  if (!displayHierarchy || !trackingHierarchy) {
    throw new Error('Expected the fixture to split into Display and Standard Tracking')
  }

  const displayVersion = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Display',
    hierarchy: displayHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: 'Updated Display.',
  })
  const trackingVersion = await repository.appendHierarchyVersion({
    jobId: job.id,
    campaignType: 'Standard Tracking',
    hierarchy: trackingHierarchy,
    status: 'ok',
    validationErrors: null,
    changeSummary: 'Updated tracking.',
  })
  const ids = [displayVersion.id, trackingVersion.id]

  const created = await Promise.all([
    repository.createMessage({
      jobId: job.id,
      role: 'user',
      content: 'No change',
      resultingVersionIds: [],
    }),
    repository.createMessage({
      jobId: job.id,
      role: 'assistant',
      content: 'One change',
      resultingVersionIds: [ids[0]!],
    }),
    repository.createMessage({
      jobId: job.id,
      role: 'assistant',
      content: 'Two changes',
      resultingVersionIds: ids,
    }),
  ])

  const persisted = await Promise.all(created.map(({ id }) => repository.findMessageById(id)))

  expect(persisted.map((message) => message?.resultingVersionIds)).toEqual([[], [ids[0]], ids])
})
