/**
 * Downloads Natural Earth 110m country boundaries and transforms them
 * into the format expected by the CountryLayer component.
 *
 * Usage: node scripts/fetch-countries.mjs
 */
import { writeFileSync } from 'fs'

const NATURAL_EARTH_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'

const CONTINENT_TO_REGION = {
  Africa: 'Africa',
  Asia: 'Asia',
  Europe: 'Europe',
  'North America': 'Americas',
  'South America': 'Americas',
  Oceania: 'Oceania',
  Antarctica: 'Antarctica',
  'Seven seas (open ocean)': 'Other',
}

async function main() {
  console.log('Fetching Natural Earth 110m countries…')
  const res = await fetch(NATURAL_EARTH_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

  const data = await res.json()
  console.log(`Fetched ${data.features.length} features`)

  const transformed = {
    type: 'FeatureCollection',
    features: data.features
      .filter((f) => f.geometry) // skip features with null geometry
      .map((f) => ({
        type: 'Feature',
        properties: {
          name: f.properties.ADMIN || f.properties.NAME || 'Unknown',
          iso_a3: f.properties.ISO_A3 !== '-99' ? f.properties.ISO_A3 : f.properties.ADM0_A3 || 'UNK',
          region: CONTINENT_TO_REGION[f.properties.CONTINENT] || f.properties.CONTINENT || 'Other',
        },
        geometry: f.geometry,
      })),
  }

  writeFileSync(
    'public/data/countries.geo.json',
    JSON.stringify(transformed),
  )
  console.log(
    `Wrote ${transformed.features.length} countries to public/data/countries.geo.json`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
