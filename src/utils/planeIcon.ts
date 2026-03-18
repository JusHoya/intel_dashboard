/**
 * Plane icon SVG data URIs and military classification utilities.
 *
 * The SVG is a top-down airplane silhouette pointing **north** (up) so that
 * CesiumJS BillboardGraphics `rotation` (clockwise from north) aligns with
 * the aircraft's `true_track` heading.
 */

// ── SVG template ───────────────────────────────────────────────────────
// A compact top-down airplane silhouette, 32×32.  The `fill` is replaced
// per-color variant.
function planeSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    `<path d="M16 1 L18.5 12 L28 15.5 L18.5 17.5 L20 28 L16 24 L12 28 L13.5 17.5 L4 15.5 L13.5 12 Z" ` +
    `fill="${fill}" stroke="#000" stroke-width="0.8"/>` +
    `</svg>`
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/** White plane icon for civilian aircraft */
export const CIVILIAN_PLANE_ICON = svgToDataUri(planeSvg('#ffffff'))

/** Red plane icon for military aircraft */
export const MILITARY_PLANE_ICON = svgToDataUri(planeSvg('#ff0040'))

// ── Military callsign detection ────────────────────────────────────────
// Common military callsign prefixes from public ICAO/FAA registries.
// This is a best-effort heuristic — OpenSky does not provide a
// "military" flag directly.
const MILITARY_PREFIXES = new Set([
  // US military
  'RCH',   // Reach (USAF heavy airlift)
  'REACH', // Alternate spelling
  'DUKE',  // US Army
  'JAKE',  // US Navy
  'NAVY',  // US Navy
  'EVAC',  // Medical evacuation
  'HERO',  // US special ops
  'TOPCT', // USAF
  'KING',  // USAF rescue
  'PEDRO', // USAF CSAR
  'JOLLY', // USAF rescue
  'BOXER', // US military
  'OTIS',  // Air National Guard
  'PACK',  // US military cargo
  'GORDO', // US military
  'COBRA', // US military
  // NATO / European
  'NATO',  // NATO flights
  'GAF',   // German Air Force
  'BAF',   // Belgian Air Force
  'FAF',   // French Air Force
  'RRR',   // RAF (Royal Air Force)
  'IAM',   // Italian Air Force
  'ASCOT', // RAF transport
  // Other
  'CNV',   // Convoy (military)
  'CFC',   // Canadian Forces
  'SPAR',  // VIP government aircraft
])

/**
 * Heuristic: returns true if the callsign looks like a military flight.
 * Checks against known military callsign prefixes.
 */
export function isMilitaryCallsign(callsign: string | null): boolean {
  if (!callsign) return false
  const cs = callsign.trim().toUpperCase()
  if (cs.length === 0) return false

  for (const prefix of MILITARY_PREFIXES) {
    if (cs.startsWith(prefix)) return true
  }
  return false
}
