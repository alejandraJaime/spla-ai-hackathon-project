import { z } from 'zod'

export const Schema_FieldDictionaryEntry = z.object({
  name: z.string().min(1),
  allowedValues: z.array(z.string().min(1)).min(1),
  isFreeform: z.boolean(),
})

export const Schema_FieldDictionary = z.array(Schema_FieldDictionaryEntry).min(1)
