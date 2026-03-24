/** A US state capital city */
export interface StateCapital {
  /** State name */
  state: string
  /** Two-letter abbreviation */
  abbr: string
  /** Capital city name */
  capital: string
  latitude: number
  longitude: number
}

/** All 50 US state capitals */
export const US_STATE_CAPITALS: readonly StateCapital[] = [
  { state: 'Alabama', abbr: 'AL', capital: 'Montgomery', latitude: 32.3792, longitude: -86.3077 },
  { state: 'Alaska', abbr: 'AK', capital: 'Juneau', latitude: 58.3005, longitude: -134.4197 },
  { state: 'Arizona', abbr: 'AZ', capital: 'Phoenix', latitude: 33.4484, longitude: -112.0740 },
  { state: 'Arkansas', abbr: 'AR', capital: 'Little Rock', latitude: 34.7465, longitude: -92.2896 },
  { state: 'California', abbr: 'CA', capital: 'Sacramento', latitude: 38.5816, longitude: -121.4944 },
  { state: 'Colorado', abbr: 'CO', capital: 'Denver', latitude: 39.7392, longitude: -104.9903 },
  { state: 'Connecticut', abbr: 'CT', capital: 'Hartford', latitude: 41.7658, longitude: -72.6734 },
  { state: 'Delaware', abbr: 'DE', capital: 'Dover', latitude: 39.1582, longitude: -75.5244 },
  { state: 'Florida', abbr: 'FL', capital: 'Tallahassee', latitude: 30.4383, longitude: -84.2807 },
  { state: 'Georgia', abbr: 'GA', capital: 'Atlanta', latitude: 33.7490, longitude: -84.3880 },
  { state: 'Hawaii', abbr: 'HI', capital: 'Honolulu', latitude: 21.3069, longitude: -157.8583 },
  { state: 'Idaho', abbr: 'ID', capital: 'Boise', latitude: 43.6150, longitude: -116.2023 },
  { state: 'Illinois', abbr: 'IL', capital: 'Springfield', latitude: 39.7817, longitude: -89.6501 },
  { state: 'Indiana', abbr: 'IN', capital: 'Indianapolis', latitude: 39.7684, longitude: -86.1581 },
  { state: 'Iowa', abbr: 'IA', capital: 'Des Moines', latitude: 41.5868, longitude: -93.6250 },
  { state: 'Kansas', abbr: 'KS', capital: 'Topeka', latitude: 39.0473, longitude: -95.6752 },
  { state: 'Kentucky', abbr: 'KY', capital: 'Frankfort', latitude: 38.2009, longitude: -84.8733 },
  { state: 'Louisiana', abbr: 'LA', capital: 'Baton Rouge', latitude: 30.4515, longitude: -91.1871 },
  { state: 'Maine', abbr: 'ME', capital: 'Augusta', latitude: 44.3106, longitude: -69.7795 },
  { state: 'Maryland', abbr: 'MD', capital: 'Annapolis', latitude: 38.9784, longitude: -76.4922 },
  { state: 'Massachusetts', abbr: 'MA', capital: 'Boston', latitude: 42.3601, longitude: -71.0589 },
  { state: 'Michigan', abbr: 'MI', capital: 'Lansing', latitude: 42.7325, longitude: -84.5555 },
  { state: 'Minnesota', abbr: 'MN', capital: 'Saint Paul', latitude: 44.9537, longitude: -93.0900 },
  { state: 'Mississippi', abbr: 'MS', capital: 'Jackson', latitude: 32.2988, longitude: -90.1848 },
  { state: 'Missouri', abbr: 'MO', capital: 'Jefferson City', latitude: 38.5767, longitude: -92.1735 },
  { state: 'Montana', abbr: 'MT', capital: 'Helena', latitude: 46.5958, longitude: -112.0270 },
  { state: 'Nebraska', abbr: 'NE', capital: 'Lincoln', latitude: 40.8136, longitude: -96.7026 },
  { state: 'Nevada', abbr: 'NV', capital: 'Carson City', latitude: 39.1638, longitude: -119.7674 },
  { state: 'New Hampshire', abbr: 'NH', capital: 'Concord', latitude: 43.2081, longitude: -71.5376 },
  { state: 'New Jersey', abbr: 'NJ', capital: 'Trenton', latitude: 40.2171, longitude: -74.7429 },
  { state: 'New Mexico', abbr: 'NM', capital: 'Santa Fe', latitude: 35.6870, longitude: -105.9378 },
  { state: 'New York', abbr: 'NY', capital: 'Albany', latitude: 42.6526, longitude: -73.7562 },
  { state: 'North Carolina', abbr: 'NC', capital: 'Raleigh', latitude: 35.7796, longitude: -78.6382 },
  { state: 'North Dakota', abbr: 'ND', capital: 'Bismarck', latitude: 46.8083, longitude: -100.7837 },
  { state: 'Ohio', abbr: 'OH', capital: 'Columbus', latitude: 39.9612, longitude: -82.9988 },
  { state: 'Oklahoma', abbr: 'OK', capital: 'Oklahoma City', latitude: 35.4676, longitude: -97.5164 },
  { state: 'Oregon', abbr: 'OR', capital: 'Salem', latitude: 44.9429, longitude: -123.0351 },
  { state: 'Pennsylvania', abbr: 'PA', capital: 'Harrisburg', latitude: 40.2732, longitude: -76.8867 },
  { state: 'Rhode Island', abbr: 'RI', capital: 'Providence', latitude: 41.8240, longitude: -71.4128 },
  { state: 'South Carolina', abbr: 'SC', capital: 'Columbia', latitude: 34.0007, longitude: -81.0348 },
  { state: 'South Dakota', abbr: 'SD', capital: 'Pierre', latitude: 44.3683, longitude: -100.3510 },
  { state: 'Tennessee', abbr: 'TN', capital: 'Nashville', latitude: 36.1627, longitude: -86.7816 },
  { state: 'Texas', abbr: 'TX', capital: 'Austin', latitude: 30.2672, longitude: -97.7431 },
  { state: 'Utah', abbr: 'UT', capital: 'Salt Lake City', latitude: 40.7608, longitude: -111.8910 },
  { state: 'Vermont', abbr: 'VT', capital: 'Montpelier', latitude: 44.2601, longitude: -72.5754 },
  { state: 'Virginia', abbr: 'VA', capital: 'Richmond', latitude: 37.5407, longitude: -77.4360 },
  { state: 'Washington', abbr: 'WA', capital: 'Olympia', latitude: 47.0379, longitude: -122.9007 },
  { state: 'West Virginia', abbr: 'WV', capital: 'Charleston', latitude: 38.3498, longitude: -81.6326 },
  { state: 'Wisconsin', abbr: 'WI', capital: 'Madison', latitude: 43.0731, longitude: -89.4012 },
  { state: 'Wyoming', abbr: 'WY', capital: 'Cheyenne', latitude: 41.1400, longitude: -104.8202 },
] as const

/** Bounding box for the continental United States (lat/lon) */
export const US_BOUNDS = {
  north: 49.3,
  south: 24.5,
  east: -66.9,
  west: -124.8,
} as const

/** Check if a camera position (lat/lon) is roughly focused on the USA */
export function isViewingUSA(latitude: number, longitude: number): boolean {
  return (
    latitude >= US_BOUNDS.south &&
    latitude <= US_BOUNDS.north &&
    longitude >= US_BOUNDS.west &&
    longitude <= US_BOUNDS.east
  )
}
