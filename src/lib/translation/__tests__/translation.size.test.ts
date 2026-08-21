import { splitSize } from '../translation.size'

describe('splitSize', () => {
  it('yields width and height from the canonical form', () => {
    expect(splitSize('300 x 250')).toEqual({ width: 300, height: 250 })
    expect(splitSize('1 x 1')).toEqual({ width: 1, height: 1 })
    expect(splitSize('1920 x 1080')).toEqual({ width: 1920, height: 1080 })
  })

  it('reads a non-numeric part as 0 rather than NaN', () => {
    expect(splitSize('responsive')).toEqual({ width: 0, height: 0 })
  })
})
