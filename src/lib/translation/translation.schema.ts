import { sql } from 'drizzle-orm'
import { check, index, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'

import { createTable } from '~/server/db/create-table'

import type { HierarchyViolation } from './hierarchy/types'
import type {
  CampaignType,
  Hierarchy,
  HierarchyVersionPointerMap,
  MediaPlatform,
  Plan,
} from './translation.types'

export const hierarchyVersionStatus = pgEnum('hierarchy_version_status', [
  'ok',
  'needs_clarification',
])

export const messageRole = pgEnum('translation_message_role', ['user', 'assistant'])

export const users = createTable('user', (d) => ({
  id: d.uuid().primaryKey(),
  name: d.varchar({ length: 256 }).notNull(),
  createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
}))

export const jobs = createTable(
  'job',
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    ownerId: d
      .uuid()
      .notNull()
      .references(() => users.id),
    platform: d.varchar({ length: 32 }).$type<MediaPlatform>().notNull(),
    sourceFileRef: d.text().notNull(),
    modelId: d.varchar({ length: 256 }).notNull(),
    plan: d.jsonb().$type<Plan>().notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [index('job_owner_idx').on(table.ownerId)],
)

export const hierarchyVersions = createTable(
  'hierarchy_version',
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    jobId: d
      .uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    campaignType: d.varchar({ length: 64 }).$type<CampaignType>().notNull(),
    versionNumber: d.integer().notNull(),
    hierarchy: d.jsonb().$type<Hierarchy>().notNull(),
    status: hierarchyVersionStatus().notNull(),
    validationErrors: d.jsonb().$type<HierarchyViolation[]>(),
    changeSummary: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    uniqueIndex('hierarchy_version_job_campaign_number_idx').on(
      table.jobId,
      table.campaignType,
      table.versionNumber,
    ),
    index('hierarchy_version_job_campaign_idx').on(table.jobId, table.campaignType),
    check('hierarchy_version_number_positive', sql`${table.versionNumber} > 0`),
    check(
      'hierarchy_version_one_campaign',
      sql`jsonb_array_length(${table.hierarchy} -> 'campaigns') = 1`,
    ),
    check(
      'hierarchy_version_campaign_type_matches',
      sql`${table.hierarchy} -> 'campaigns' -> 0 ->> 'campaignType' = ${table.campaignType}`,
    ),
    check(
      'hierarchy_version_validation_errors_match_status',
      sql`(
        (${table.status} = 'ok' AND ${table.validationErrors} IS NULL)
        OR
        (
          ${table.status} = 'needs_clarification'
          AND jsonb_typeof(${table.validationErrors}) = 'array'
          AND jsonb_array_length(${table.validationErrors}) > 0
        )
      )`,
    ),
  ],
)

export const messages = createTable(
  'message',
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    jobId: d
      .uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    role: messageRole().notNull(),
    content: d.text().notNull(),
    resultingVersionIds: d
      .jsonb()
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [index('message_job_idx').on(table.jobId)],
)

export const jobVersions = createTable(
  'job_version',
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    jobId: d
      .uuid()
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    versionNumber: d.integer().notNull(),
    messageId: d.uuid().references(() => messages.id),
    pointerMap: d.jsonb().$type<HierarchyVersionPointerMap>().notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    uniqueIndex('job_version_job_number_idx').on(table.jobId, table.versionNumber),
    index('job_version_message_idx').on(table.messageId),
    check('job_version_number_positive', sql`${table.versionNumber} > 0`),
  ],
)
