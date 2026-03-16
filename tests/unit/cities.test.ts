import { FINANCIAL_CENTERS } from '../../src/data/cities'

describe('FINANCIAL_CENTERS', () => {
  it('has 15 entries', () => {
    expect(FINANCIAL_CENTERS).toHaveLength(15)
  })

  it('each city has required fields (id, name, country, latitude, longitude)', () => {
    for (const city of FINANCIAL_CENTERS) {
      expect(city).toHaveProperty('id')
      expect(city).toHaveProperty('name')
      expect(city).toHaveProperty('country')
      expect(city).toHaveProperty('latitude')
      expect(city).toHaveProperty('longitude')
      expect(typeof city.id).toBe('string')
      expect(typeof city.name).toBe('string')
      expect(typeof city.country).toBe('string')
      expect(typeof city.latitude).toBe('number')
      expect(typeof city.longitude).toBe('number')
    }
  })

  it('latitude values are between -90 and 90', () => {
    for (const city of FINANCIAL_CENTERS) {
      expect(city.latitude).toBeGreaterThanOrEqual(-90)
      expect(city.latitude).toBeLessThanOrEqual(90)
    }
  })

  it('longitude values are between -180 and 180', () => {
    for (const city of FINANCIAL_CENTERS) {
      expect(city.longitude).toBeGreaterThanOrEqual(-180)
      expect(city.longitude).toBeLessThanOrEqual(180)
    }
  })

  it('all city IDs are unique', () => {
    const ids = FINANCIAL_CENTERS.map((c) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
