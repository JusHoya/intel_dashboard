/** A public CCTV / traffic camera feed */
export interface CCTVFeed {
  id: string
  name: string
  location: string
  /** Stream or snapshot URL */
  url: string
  /** Type of feed */
  type: 'image' | 'stream' | 'youtube'
  /** YouTube channel or video ID for embeddable streams */
  youtubeId?: string
  /** Approximate coordinates */
  latitude: number
  longitude: number
  /** Refresh interval for image feeds (ms) */
  refreshMs?: number
}

/**
 * Curated list of publicly accessible traffic/city cameras.
 * Mix of DOT image snapshots and YouTube live streams.
 */
export const CCTV_FEEDS: readonly CCTVFeed[] = [
  // === YouTube Live Traffic/City Cameras ===
  {
    id: 'nyc-times-sq',
    name: 'Times Square NYC',
    location: 'New York, NY',
    url: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'AdUw5RdyZxI',
    latitude: 40.7580,
    longitude: -73.9855,
  },
  {
    id: 'tokyo-shibuya',
    name: 'Shibuya Crossing',
    location: 'Tokyo, Japan',
    url: 'https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'DjdUEyjx8GM',
    latitude: 35.6595,
    longitude: 139.7004,
  },
  {
    id: 'dublin-oconnell',
    name: "O'Connell Street",
    location: 'Dublin, Ireland',
    url: 'https://www.youtube.com/embed/eAj6MIbLDxQ?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'eAj6MIbLDxQ',
    latitude: 53.3498,
    longitude: -6.2603,
  },
  {
    id: 'jackson-hole',
    name: 'Town Square',
    location: 'Jackson Hole, WY',
    url: 'https://www.youtube.com/embed/DoEpDBJCiis?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'DoEpDBJCiis',
    latitude: 43.4799,
    longitude: -110.7624,
  },
  {
    id: 'abbey-road',
    name: 'Abbey Road Crossing',
    location: 'London, UK',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'b4gJnEFojiI',
    latitude: 51.5320,
    longitude: -0.1780,
  },
  {
    id: 'la-hollywood',
    name: 'Hollywood Blvd',
    location: 'Los Angeles, CA',
    url: 'https://www.youtube.com/embed/vCadcBR95oU?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'vCadcBR95oU',
    latitude: 34.1016,
    longitude: -118.3267,
  },
  {
    id: 'miami-beach',
    name: 'South Beach',
    location: 'Miami, FL',
    url: 'https://www.youtube.com/embed/PxVnRe6WQIY?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'PxVnRe6WQIY',
    latitude: 25.7826,
    longitude: -80.1341,
  },
  {
    id: 'iss-live',
    name: 'ISS Live Earth View',
    location: 'Low Earth Orbit',
    url: 'https://www.youtube.com/embed/P9C25Un7xaM?autoplay=0&mute=1',
    type: 'youtube',
    youtubeId: 'P9C25Un7xaM',
    latitude: 0,
    longitude: 0,
  },
] as const
