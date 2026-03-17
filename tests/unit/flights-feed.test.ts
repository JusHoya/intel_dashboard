import { fetchFlights, interpolateFlights, type FlightSnapshot } from '../../src/feeds/flights'
import { isMilitaryCallsign } from '../../src/utils/planeIcon'
import type { FlightState } from '../../src/types/flights'

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

// ── Interpolation ──────────────────────────────────────────────────────

function makeFlight(overrides: Partial<FlightState> = {}): FlightState {
  return {
    icao24: 'test01',
    callsign: 'TST001',
    origin_country: 'Testland',
    longitude: 0,
    latitude: 0,
    baro_altitude: 10000,
    velocity: 250,
    true_track: 90,
    on_ground: false,
    last_contact: 1700000000,
    ...overrides,
  }
}

describe('interpolateFlights', () => {
  it('returns raw positions when only one snapshot is available', () => {
    const snap: FlightSnapshot = {
      flights: [makeFlight({ latitude: 50, longitude: 10 })],
      timestamp: 1000,
      receivedAt: 1000000,
    }

    const result = interpolateFlights(null, snap, 1000000)
    expect(result).toHaveLength(1)
    expect(result[0].interpLatitude).toBe(50)
    expect(result[0].interpLongitude).toBe(10)
  })

  it('interpolates midpoint between two snapshots at t=0.5', () => {
    const prev: FlightSnapshot = {
      flights: [makeFlight({ icao24: 'a1', latitude: 40, longitude: 10 })],
      timestamp: 1000,
      receivedAt: 10000,
    }
    const current: FlightSnapshot = {
      flights: [makeFlight({ icao24: 'a1', latitude: 50, longitude: 20 })],
      timestamp: 1015,
      receivedAt: 25000,
    }

    // displayTime at midpoint between receivedAt values
    const displayTime = 17500 // exactly halfway
    const result = interpolateFlights(prev, current, displayTime)

    expect(result).toHaveLength(1)
    expect(result[0].interpLatitude).toBeCloseTo(45, 1)
    expect(result[0].interpLongitude).toBeCloseTo(15, 1)
  })

  it('clamps t to [0, 1] when display time is out of range', () => {
    const prev: FlightSnapshot = {
      flights: [makeFlight({ icao24: 'a1', latitude: 40, longitude: 10 })],
      timestamp: 1000,
      receivedAt: 10000,
    }
    const current: FlightSnapshot = {
      flights: [makeFlight({ icao24: 'a1', latitude: 50, longitude: 20 })],
      timestamp: 1015,
      receivedAt: 25000,
    }

    // Display time way past current → clamped to t=1
    const result = interpolateFlights(prev, current, 999999)
    expect(result[0].interpLatitude).toBeCloseTo(50, 1)
    expect(result[0].interpLongitude).toBeCloseTo(20, 1)

    // Display time before prev → clamped to t=0
    const result2 = interpolateFlights(prev, current, 0)
    expect(result2[0].interpLatitude).toBeCloseTo(40, 1)
    expect(result2[0].interpLongitude).toBeCloseTo(10, 1)
  })

  it('handles antimeridian longitude wrap-around', () => {
    const prev: FlightSnapshot = {
      flights: [makeFlight({ icao24: 'a1', latitude: 40, longitude: 170 })],
      timestamp: 1000,
      receivedAt: 10000,
    }
    const current: FlightSnapshot = {
      flights: [makeFlight({ icao24: 'a1', latitude: 40, longitude: -170 })],
      timestamp: 1015,
      receivedAt: 25000,
    }

    // Midpoint should cross the antimeridian (170 → 180/-180 → -170)
    const result = interpolateFlights(prev, current, 17500)
    expect(result[0].interpLongitude).toBeCloseTo(180, 0)
  })

  it('filters out flights with null coordinates', () => {
    const snap: FlightSnapshot = {
      flights: [
        makeFlight({ icao24: 'a1', latitude: 50, longitude: 10 }),
        makeFlight({ icao24: 'a2', latitude: null, longitude: null }),
      ],
      timestamp: 1000,
      receivedAt: 1000000,
    }

    const result = interpolateFlights(null, snap, 1000000)
    expect(result).toHaveLength(1)
    expect(result[0].icao24).toBe('a1')
  })
})
