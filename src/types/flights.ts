export interface FlightState {
  icao24: string
  callsign: string | null
  origin_country: string
  longitude: number | null
  latitude: number | null
  baro_altitude: number | null
  velocity: number | null
  true_track: number | null
  on_ground: boolean
  last_contact: number
}

export interface FlightsResponse {
  flights: FlightState[]
  timestamp: number
}
