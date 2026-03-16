import express from 'express'
import cors from 'cors'
import type { FlightState } from '../src/types/flights.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))

/** Transform OpenSky state array into a FlightState object */
function parseStateVector(state: unknown[]): FlightState {
  return {
    icao24: state[0] as string,
    callsign: typeof state[1] === 'string' ? state[1].trim() || null : null,
    origin_country: state[2] as string,
    last_contact: state[4] as number,
    longitude: state[5] as number | null,
    latitude: state[6] as number | null,
    baro_altitude: state[7] as number | null,
    on_ground: state[8] as boolean,
    velocity: state[9] as number | null,
    true_track: state[10] as number | null,
  }
}

/** Generate mock flight data when OpenSky is unreachable */
function generateMockFlights(): FlightState[] {
  const now = Math.floor(Date.now() / 1000)

  return [
    // Transatlantic corridor
    { icao24: 'a0b1c2', callsign: 'UAL123', origin_country: 'United States', longitude: -30.5, latitude: 48.2, baro_altitude: 11280, velocity: 245, true_track: 72, on_ground: false, last_contact: now },
    { icao24: 'a1b2c3', callsign: 'BAW456', origin_country: 'United Kingdom', longitude: -20.3, latitude: 51.1, baro_altitude: 10670, velocity: 252, true_track: 265, on_ground: false, last_contact: now },
    { icao24: 'a2b3c4', callsign: 'DAL789', origin_country: 'United States', longitude: -45.8, latitude: 44.6, baro_altitude: 11890, velocity: 238, true_track: 68, on_ground: false, last_contact: now },
    { icao24: 'a3b4c5', callsign: 'AFR101', origin_country: 'France', longitude: -10.2, latitude: 49.8, baro_altitude: 10360, velocity: 241, true_track: 255, on_ground: false, last_contact: now },

    // European airspace
    { icao24: 'b0c1d2', callsign: 'DLH202', origin_country: 'Germany', longitude: 10.5, latitude: 50.3, baro_altitude: 9750, velocity: 228, true_track: 180, on_ground: false, last_contact: now },
    { icao24: 'b1c2d3', callsign: 'RYR303', origin_country: 'Ireland', longitude: -2.1, latitude: 53.4, baro_altitude: 11120, velocity: 232, true_track: 135, on_ground: false, last_contact: now },
    { icao24: 'b2c3d4', callsign: 'SAS404', origin_country: 'Sweden', longitude: 14.8, latitude: 58.2, baro_altitude: 10060, velocity: 219, true_track: 210, on_ground: false, last_contact: now },
    { icao24: 'b3c4d5', callsign: 'IBE505', origin_country: 'Spain', longitude: -3.7, latitude: 40.4, baro_altitude: 8530, velocity: 205, true_track: 45, on_ground: false, last_contact: now },

    // Transpacific corridor
    { icao24: 'c0d1e2', callsign: 'JAL606', origin_country: 'Japan', longitude: -170.2, latitude: 42.5, baro_altitude: 11580, velocity: 258, true_track: 55, on_ground: false, last_contact: now },
    { icao24: 'c1d2e3', callsign: 'ANA707', origin_country: 'Japan', longitude: 165.3, latitude: 38.9, baro_altitude: 10920, velocity: 249, true_track: 60, on_ground: false, last_contact: now },
    { icao24: 'c2d3e4', callsign: 'UAL808', origin_country: 'United States', longitude: -150.6, latitude: 45.1, baro_altitude: 11350, velocity: 255, true_track: 270, on_ground: false, last_contact: now },
    { icao24: 'c3d4e5', callsign: 'KAL909', origin_country: 'South Korea', longitude: -175.8, latitude: 47.3, baro_altitude: 10480, velocity: 243, true_track: 48, on_ground: false, last_contact: now },

    // Asian airspace
    { icao24: 'd0e1f2', callsign: 'CCA110', origin_country: 'China', longitude: 116.4, latitude: 39.9, baro_altitude: 9200, velocity: 215, true_track: 155, on_ground: false, last_contact: now },
    { icao24: 'd1e2f3', callsign: 'SIA211', origin_country: 'Singapore', longitude: 103.8, latitude: 1.4, baro_altitude: 11750, velocity: 248, true_track: 320, on_ground: false, last_contact: now },
    { icao24: 'd2e3f4', callsign: 'CPA312', origin_country: 'Hong Kong', longitude: 110.5, latitude: 18.6, baro_altitude: 10890, velocity: 236, true_track: 200, on_ground: false, last_contact: now },
    { icao24: 'd3e4f5', callsign: 'THA413', origin_country: 'Thailand', longitude: 100.5, latitude: 13.8, baro_altitude: 8960, velocity: 209, true_track: 290, on_ground: false, last_contact: now },

    // Middle East / Africa
    { icao24: 'e0f1a2', callsign: 'UAE514', origin_country: 'United Arab Emirates', longitude: 55.3, latitude: 25.3, baro_altitude: 11460, velocity: 253, true_track: 310, on_ground: false, last_contact: now },
    { icao24: 'e1f2a3', callsign: 'QTR615', origin_country: 'Qatar', longitude: 48.7, latitude: 30.2, baro_altitude: 10150, velocity: 241, true_track: 275, on_ground: false, last_contact: now },
    { icao24: 'e2f3a4', callsign: 'ETH716', origin_country: 'Ethiopia', longitude: 38.7, latitude: 9.0, baro_altitude: 11070, velocity: 230, true_track: 180, on_ground: false, last_contact: now },
    { icao24: 'e3f4a5', callsign: 'SAA817', origin_country: 'South Africa', longitude: 28.2, latitude: -26.1, baro_altitude: 10530, velocity: 225, true_track: 15, on_ground: false, last_contact: now },

    // South America
    { icao24: 'f0a1b2', callsign: 'TAM918', origin_country: 'Brazil', longitude: -46.6, latitude: -23.5, baro_altitude: 9870, velocity: 218, true_track: 350, on_ground: false, last_contact: now },
    { icao24: 'f1a2b3', callsign: 'AVA019', origin_country: 'Colombia', longitude: -74.1, latitude: 4.7, baro_altitude: 10740, velocity: 234, true_track: 190, on_ground: false, last_contact: now },

    // Australia / Oceania
    { icao24: 'f2a3b4', callsign: 'QFA120', origin_country: 'Australia', longitude: 151.2, latitude: -33.9, baro_altitude: 11190, velocity: 247, true_track: 330, on_ground: false, last_contact: now },
    { icao24: 'f3a4b5', callsign: 'ANZ221', origin_country: 'New Zealand', longitude: 174.8, latitude: -41.3, baro_altitude: 10280, velocity: 222, true_track: 25, on_ground: false, last_contact: now },

    // North America domestic
    { icao24: 'f4a5b6', callsign: 'AAL322', origin_country: 'United States', longitude: -95.3, latitude: 35.2, baro_altitude: 10670, velocity: 231, true_track: 90, on_ground: false, last_contact: now },
  ]
}

app.get('/api/flights', async (_req, res) => {
  try {
    console.log('[flights] Fetching from OpenSky Network...')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch('https://opensky-network.org/api/states/all', {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`OpenSky returned status ${response.status}`)
    }

    const data = (await response.json()) as { time: number; states: unknown[][] | null }

    if (!data.states || !Array.isArray(data.states)) {
      throw new Error('OpenSky returned no state vectors')
    }

    const flights: FlightState[] = data.states
      .map(parseStateVector)
      .filter((f): f is FlightState & { latitude: number; longitude: number } =>
        f.latitude !== null && f.longitude !== null,
      )

    console.log(`[flights] Fetched ${flights.length} active flights from OpenSky`)

    res.json({ flights, timestamp: data.time })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[flights] OpenSky unavailable (${message}), returning mock data`)

    const mockFlights = generateMockFlights()
    res.json({
      flights: mockFlights,
      timestamp: Math.floor(Date.now() / 1000),
    })
  }
})

app.listen(PORT, () => {
  console.log(`[server] Flight proxy running on http://localhost:${PORT}`)
  console.log(`[server] CORS enabled for http://localhost:5173`)
})
