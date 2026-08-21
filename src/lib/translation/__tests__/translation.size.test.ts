import { dictionaryValues } from '../knowledge'
import { splitSize } from '../translation.size'
import {
  Schema_AdEntity,
  Schema_CanonicalSize,
  Schema_CreativeEntity,
  Schema_PlacementEntity,
  Schema_Tactic,
} from '../translation.validation'

describe('splitSize', () => {
  it.each([
    ['300 x 250', 300, 250],
    ['1 x 1', 1, 1],
    ['1920 x 1080', 1920, 1080],
    ['728 x 90', 728, 90],
  ])('splits %s into width and height', (size, width, height) => {
    expect(splitSize(size)).toEqual({ width, height })
  })

  it('reads a non-numeric part as 0 rather than NaN, so arithmetic downstream is safe', () => {
    expect(splitSize('responsive')).toEqual({ width: 0, height: 0 })
  })

  it('splits every size the dictionary allows into positive dimensions', () => {
    for (const size of dictionaryValues('Size')) {
      const { width, height } = splitSize(size)

      expect(width).toBeGreaterThan(0)
      expect(height).toBeGreaterThan(0)
      expect(`${width} x ${height}`).toBe(size)
    }
  })
})

describe('the canonical size form', () => {
  it('is the dictionary spelling, with spaces around the x', () => {
    expect(Schema_CanonicalSize.safeParse('300 x 250').success).toBe(true)
  })

  it.each(['300x250', '300 X 250', '300*250', 'responsive', '300 x 250 ', ''])(
    'rejects %s, which is not the canonical form',
    (size) => {
      expect(Schema_CanonicalSize.safeParse(size).success).toBe(false)
    },
  )

  it('accepts every size the dictionary allows', () => {
    for (const size of dictionaryValues('Size')) {
      expect(Schema_CanonicalSize.safeParse(size).success).toBe(true)
    }
  })
})

describe('the contracts', () => {
  /* Numbers come from `splitSize()` at the point of use. A stored width/height
   * pair would be a second representation, free to drift from the string. */
  it.each([
    ['placement', Object.keys(Schema_PlacementEntity.shape)],
    ['creative', Object.keys(Schema_CreativeEntity.shape)],
    ['ad', Object.keys(Schema_AdEntity.shape)],
    ['tactic', Object.keys(Schema_Tactic.shape)],
  ])('store no second size representation on the %s', (_entity, fields) => {
    expect(fields).not.toContain('width')
    expect(fields).not.toContain('height')
    expect(fields).not.toContain('sizePx')
  })

  it('sizes an entity with exactly one canonical size field', () => {
    expect(Schema_PlacementEntity.shape.size).toBeDefined()
    expect(Schema_CreativeEntity.shape.size).toBeDefined()
  })
})
