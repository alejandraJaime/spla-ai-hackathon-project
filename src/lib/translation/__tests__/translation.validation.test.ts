import type { z } from 'zod'

import { buildDictionaryEnum, readKnowledgeDocument } from '../knowledge'
import { Schema_FieldDictionary } from '../knowledge/validation'
import type { DictionaryFieldName, FieldDictionary } from '../knowledge/types'
import {
  Schema_Audience,
  Schema_CampaignObjective,
  Schema_CampaignType,
  Schema_Country,
  Schema_Device,
  Schema_DictionarySize,
  Schema_Hierarchy,
  Schema_Inventory,
  Schema_MediaFormat,
  Schema_MediaPlatform,
  Schema_MediaType,
  Schema_Plan,
  Schema_Publisher,
  Schema_Region,
  Schema_TacticToken,
} from '../translation.validation'
import { clone, VALID_HIERARCHY, VALID_PLAN } from './fixtures'

describe('the Plan contract', () => {
  it('parses a hand-written valid plan', () => {
    expect(Schema_Plan.parse(VALID_PLAN)).toEqual(VALID_PLAN)
  })

  it('rejects a plan with no tactics', () => {
    const malformed = { ...clone(VALID_PLAN), tactics: [] }

    expect(Schema_Plan.safeParse(malformed).success).toBe(false)
  })

  it('rejects a tactic missing a required field', () => {
    const malformed = clone(VALID_PLAN) as Record<string, unknown>
    const [tactic] = malformed.tactics as Record<string, unknown>[]
    delete tactic!.trackingOnly

    expect(Schema_Plan.safeParse(malformed).success).toBe(false)
  })

  it('rejects free-text that was not normalised to a coarse channel value', () => {
    const malformed = clone(VALID_PLAN) as Record<string, unknown>
    const [tactic] = malformed.tactics as Record<string, unknown>[]
    tactic!.channel = 'banners'

    expect(Schema_Plan.safeParse(malformed).success).toBe(false)
  })
})

describe('the Hierarchy contract', () => {
  it('parses a hand-written valid hierarchy', () => {
    expect(Schema_Hierarchy.parse(VALID_HIERARCHY)).toEqual(VALID_HIERARCHY)
  })

  it('rejects an ad that is assigned to no placement', () => {
    const malformed = clone(VALID_HIERARCHY)
    malformed.ads[0]!.placementIds = []

    expect(Schema_Hierarchy.safeParse(malformed).success).toBe(false)
  })

  it('rejects a campaign type the field dictionary does not define', () => {
    const malformed = clone(VALID_HIERARCHY)
    malformed.campaigns[0]!.campaignType = 'Programmatic Audio'

    expect(Schema_Hierarchy.safeParse(malformed).success).toBe(false)
  })

  it('rejects a platform other than CM360', () => {
    const malformed = { ...clone(VALID_HIERARCHY), platform: 'DV360' }

    expect(Schema_Hierarchy.safeParse(malformed).success).toBe(false)
  })

  it('holds entities as flat arrays, with ads referencing placements and creatives by id', () => {
    const hierarchy = Schema_Hierarchy.parse(VALID_HIERARCHY)

    for (const entities of [
      hierarchy.campaigns,
      hierarchy.sites,
      hierarchy.landingPages,
      hierarchy.placements,
      hierarchy.creatives,
      hierarchy.ads,
    ]) {
      expect(Array.isArray(entities)).toBe(true)
    }

    const [ad] = hierarchy.ads
    expect(ad!.placementIds).toEqual(['plc_1'])
    expect(ad!.creativeIds).toEqual(['cre_1'])
    expect(hierarchy.placements.map((placement) => placement.id)).toContain(ad!.placementIds[0])
    expect(hierarchy.creatives.map((creative) => creative.id)).toContain(ad!.creativeIds[0])
    expect(hierarchy.campaigns.map((campaign) => campaign.id)).toContain(ad!.campaignId)
  })

  it('keeps campaigns an array, one entry per Campaign Type (ADR-0001)', () => {
    const hierarchy = Schema_Hierarchy.parse(VALID_HIERARCHY)
    expect(hierarchy.campaigns.map((campaign) => campaign.campaignType)).toEqual([
      'Display',
      'Standard Tracking',
    ])

    const singular = { ...clone(VALID_HIERARCHY), campaigns: VALID_HIERARCHY.campaigns[0] }
    expect(Schema_Hierarchy.safeParse(singular).success).toBe(false)

    const empty = { ...clone(VALID_HIERARCHY), campaigns: [] }
    expect(Schema_Hierarchy.safeParse(empty).success).toBe(false)
  })
})

describe('the canonical size form', () => {
  it('accepts the spaced dictionary spelling in the plan and the hierarchy', () => {
    expect(Schema_Plan.safeParse(VALID_PLAN).success).toBe(true)
    expect(Schema_Hierarchy.safeParse(VALID_HIERARCHY).success).toBe(true)
  })

  it('rejects the unspaced form on a plan tactic', () => {
    const malformed = clone(VALID_PLAN)
    malformed.tactics[0]!.adSizes = ['300x250']

    expect(Schema_Plan.safeParse(malformed).success).toBe(false)
  })

  it('rejects the unspaced form on a placement and on a creative', () => {
    const malformedPlacement = clone(VALID_HIERARCHY)
    malformedPlacement.placements[0]!.size = '300x250'
    expect(Schema_Hierarchy.safeParse(malformedPlacement).success).toBe(false)

    const malformedCreative = clone(VALID_HIERARCHY)
    malformedCreative.creatives[0]!.size = '300x250'
    expect(Schema_Hierarchy.safeParse(malformedCreative).success).toBe(false)
  })
})

describe('hard-constrained enums derived from the field dictionary', () => {
  const derivedSchemas: [DictionaryFieldName, z.ZodEnum<[string, ...string[]]>][] = [
    ['Size', Schema_DictionarySize],
    ['Media Type', Schema_MediaType],
    ['Inventory', Schema_Inventory],
    ['Campaign Type', Schema_CampaignType],
    ['Platform', Schema_MediaPlatform],
    ['Tactic', Schema_TacticToken],
    ['Campaign Objective', Schema_CampaignObjective],
    ['Audience', Schema_Audience],
    ['Publisher', Schema_Publisher],
    ['Media Format', Schema_MediaFormat],
    ['Device', Schema_Device],
    ['Country', Schema_Country],
    ['Region', Schema_Region],
  ]

  /** Read from disk, not from the module's import, so a hand-copied list shows up. */
  const dictionaryOnDisk: FieldDictionary = Schema_FieldDictionary.parse(
    JSON.parse(readKnowledgeDocument('fieldDictionary')),
  )

  it.each(derivedSchemas)('%s accepts exactly what the dictionary allows', (fieldName, schema) => {
    const field = dictionaryOnDisk.find((entry) => entry.name === fieldName)

    expect(schema.options).toEqual(field!.allowedValues)
    for (const value of field!.allowedValues) {
      expect(schema.safeParse(value).success).toBe(true)
    }
    expect(schema.safeParse('not-a-dictionary-value').success).toBe(false)
  })

  it('accepts a value added to the dictionary with no second edit', () => {
    const extendedDictionary: FieldDictionary = dictionaryOnDisk.map((entry) =>
      entry.name === 'Country'
        ? { ...entry, allowedValues: [...entry.allowedValues, 'ZZ'] }
        : entry,
    )

    expect(Schema_Country.safeParse('ZZ').success).toBe(false)
    expect(buildDictionaryEnum('Country', extendedDictionary).safeParse('ZZ').success).toBe(true)
  })

  it('lets a Campaign Type added to the dictionary file through the Hierarchy contract', async () => {
    const dictionaryPath = '../knowledge/documents/taxonomy-fields.json'
    const extendedDictionary: FieldDictionary = dictionaryOnDisk.map((entry) =>
      entry.name === 'Campaign Type'
        ? { ...entry, allowedValues: [...entry.allowedValues, 'Connected TV'] }
        : entry,
    )

    const hierarchy = clone(VALID_HIERARCHY)
    hierarchy.campaigns = [{ ...hierarchy.campaigns[0]!, campaignType: 'Connected TV' }]
    hierarchy.placements = []
    hierarchy.creatives = []
    hierarchy.ads = []

    expect(Schema_Hierarchy.safeParse(hierarchy).success).toBe(false)

    try {
      jest.resetModules()
      jest.doMock(dictionaryPath, () => extendedDictionary)
      const reloaded = await import('../translation.validation')

      expect(reloaded.Schema_Hierarchy.safeParse(hierarchy).success).toBe(true)
    } finally {
      jest.dontMock(dictionaryPath)
      jest.resetModules()
    }
  })

  it('derives the campaign type the Hierarchy contract enforces', () => {
    const dictionaryCampaignTypes = dictionaryOnDisk.find((entry) => entry.name === 'Campaign Type')

    for (const campaignType of dictionaryCampaignTypes!.allowedValues) {
      const hierarchy = clone(VALID_HIERARCHY)
      hierarchy.campaigns = [{ ...hierarchy.campaigns[0]!, campaignType }]
      hierarchy.placements = []
      hierarchy.creatives = []
      hierarchy.ads = []

      expect(Schema_Hierarchy.safeParse(hierarchy).success).toBe(true)
    }
  })
})
