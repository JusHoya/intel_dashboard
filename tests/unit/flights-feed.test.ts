import { fetchFlights } from '../../src/feeds/flights'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchFlights', () => {
  it('returns an array of flights on success', async () => {
    const mockFlights = [
      {
        icao24: 'abc123',
        callsign: 'UAL123',
        origin_country: 'United States',
        longitude: -74.006,
        latitude: 40.7128,
        baro_altitude: 10000,
        velocity: 250,
        true_track: 180,
        on_ground: false,
        last_contact: 1700000000,
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ flights: mockFlights, timestamp: Date.now() }),
      })
    )

    const result = await fetchFlights()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0].icao24).toBe('abc123')
    expect(result[0].callsign).toBe('UAL123')
  })

  it('handles network errors gracefully and returns empty array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network failure'))
    )

    const result = await fetchFlights()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('handles non-ok response and returns empty array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    )

    const result = await fetchFlights()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })
})
