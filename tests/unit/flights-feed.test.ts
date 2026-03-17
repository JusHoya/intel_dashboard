import { fetchFlights, lerp, lerpLongitude } from '../../src/feeds/flights'
import { isMilitaryCallsign } from '../../src/utils/planeIcon'

afterEach(() => {
  vi.restoreAllMocks()
})

// ── fetchFlights ───────────────────────────────────────────────────────

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

  it('passes bounding box params to API URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ flights: [], timestamp: Date.now() }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchFlights({ lamin: 40, lomin: -80, lamax: 50, lomax: -70 })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('lamin=40.00')
    expect(calledUrl).toContain('lomin=-80.00')
    expect(calledUrl).toContain('lamax=50.00')
    expect(calledUrl).toContain('lomax=-70.00')
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

// ── Military classification ────────────────────────────────────────────

describe('isMilitaryCallsign', () => {
  it('identifies known military callsign prefixes', () => {
    expect(isMilitaryCallsign('RCH123')).toBe(true)
    expect(isMilitaryCallsign('REACH01')).toBe(true)
    expect(isMilitaryCallsign('NAVY42')).toBe(true)
    expect(isMilitaryCallsign('GAF001')).toBe(true)
    expect(isMilitaryCallsign('ASCOT99')).toBe(true)
    expect(isMilitaryCallsign('RRR1234')).toBe(true)
  })

  it('classifies civilian callsigns correctly', () => {
    expect(isMilitaryCallsign('UAL123')).toBe(false)
    expect(isMilitaryCallsign('BAW456')).toBe(false)
    expect(isMilitaryCallsign('DAL789')).toBe(false)
    expect(isMilitaryCallsign('SIA211')).toBe(false)
  })

  it('handles null and empty callsigns', () => {
    expect(isMilitaryCallsign(null)).toBe(false)
    expect(isMilitaryCallsign('')).toBe(false)
    expect(isMilitaryCallsign('  ')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isMilitaryCallsign('rch123')).toBe(true)
    expect(isMilitaryCallsign('Navy42')).toBe(true)
  })
})

// ── lerp / lerpLongitude ──────────────────────────────────────────────

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('returns midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15)
  })

  it('handles negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0)
  })
})

describe('lerpLongitude', () => {
  it('interpolates simple longitudes', () => {
    expect(lerpLongitude(10, 20, 0.5)).toBeCloseTo(15, 5)
  })

  it('handles antimeridian wrap (170 → -170 should go through 180)', () => {
    const result = lerpLongitude(170, -170, 0.5)
    // Shortest arc: 170 → 180 → -170, midpoint ≈ 180 or -180
    expect(Math.abs(result)).toBeCloseTo(180, 0)
  })

  it('handles antimeridian wrap in reverse direction', () => {
    const result = lerpLongitude(-170, 170, 0.5)
    expect(Math.abs(result)).toBeCloseTo(180, 0)
  })

  it('returns a at t=0', () => {
    expect(lerpLongitude(10, 20, 0)).toBe(10)
  })

  it('returns b at t=1', () => {
    expect(lerpLongitude(10, 20, 1)).toBe(20)
  })
})
