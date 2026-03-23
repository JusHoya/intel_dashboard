/**
 * Satellite icon SVG data URIs for globe rendering.
 *
 * Generates a simple satellite silhouette with solar panels,
 * designed to be recognizable at small pixel sizes (12-28px).
 */

function satelliteSvg(fill: string): string {
  // A compact satellite silhouette: central body with two solar panels
  // Viewbox 32x32, centered. Body is a small rectangle, panels are wider rectangles.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    // Left solar panel
    `<rect x="2" y="13" width="10" height="6" rx="1" fill="${fill}" stroke="#000" stroke-width="0.6" opacity="0.85"/>` +
    // Right solar panel
    `<rect x="20" y="13" width="10" height="6" rx="1" fill="${fill}" stroke="#000" stroke-width="0.6" opacity="0.85"/>` +
    // Central body
    `<rect x="12" y="11" width="8" height="10" rx="1.5" fill="${fill}" stroke="#000" stroke-width="0.7"/>` +
    // Antenna dish (small circle on top)
    `<circle cx="16" cy="9" r="2" fill="${fill}" stroke="#000" stroke-width="0.5"/>` +
    // Antenna mast
    `<line x1="16" y1="11" x2="16" y2="9" stroke="#000" stroke-width="0.6"/>` +
    // Panel grid lines (left)
    `<line x1="7" y1="13" x2="7" y2="19" stroke="#000" stroke-width="0.3" opacity="0.5"/>` +
    // Panel grid lines (right)
    `<line x1="25" y1="13" x2="25" y2="19" stroke="#000" stroke-width="0.3" opacity="0.5"/>` +
    `</svg>`
  )
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/** Cyan satellite icon for general satellites */
export const SATELLITE_ICON_CYAN = svgToDataUri(satelliteSvg('#00ffff'))

/** Gold satellite icon for ISS */
export const SATELLITE_ICON_GOLD = svgToDataUri(satelliteSvg('#ffd700'))

/** Dim blue-gray icon for Starlink constellation */
export const SATELLITE_ICON_STARLINK = svgToDataUri(satelliteSvg('#0891b2'))

/**
 * Get satellite icon data URI by color string.
 * Caches generated icons to avoid redundant SVG encoding.
 */
const iconCache = new Map<string, string>()

export function getSatelliteIcon(color: string): string {
  const cached = iconCache.get(color)
  if (cached) return cached
  const uri = svgToDataUri(satelliteSvg(color))
  iconCache.set(color, uri)
  return uri
}
