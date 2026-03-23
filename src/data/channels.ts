import type { YouTubeChannel } from '../types/news'

/**
 * YouTube live news channels.
 *
 * Channels with a `channelId` use the auto-resolving live_stream embed URL:
 *   https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
 * This avoids stale video IDs, since 24/7 live streams rotate IDs frequently.
 *
 * Channels marked `embedBlocked: true` are known to restrict iframe embedding.
 */
export const NEWS_CHANNELS: readonly YouTubeChannel[] = [
  {
    name: 'Al Jazeera English',
    channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg',
    notes: '24/7 English live stream',
  },
  {
    name: 'France 24 English',
    channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg',
    notes: '24/7 English live stream',
  },
  {
    name: 'DW News',
    channelId: 'UCknLrEdhRCp1aegoMqRaCZg',
    notes: 'Deutsche Welle English live stream',
  },
  {
    name: 'Sky News',
    channelId: 'UCoMdktPbSTixAyNGwb-UYkQ',
    notes: 'UK 24/7 live stream',
  },
  {
    name: 'ABC News Australia',
    channelId: 'UCVgO39Bk5sMo66-6o6Spn6Q',
    notes: 'Australian Broadcasting Corporation',
  },
  {
    name: 'NDTV',
    channelId: 'UCl5a3kbSWt_CkAMdTyRNzEQ',
    notes: 'Indian news, 24/7 English',
  },
  {
    name: 'NHK World',
    channelId: 'UCLXo7UDZvByw2ixzpQCufnA',
    notes: 'Japan international news',
  },
  {
    name: 'Arirang',
    channelId: 'UCSDv8E27dNaYjYYRjpstd7A',
    notes: 'South Korean international news',
  },
  {
    name: 'Bloomberg',
    embedBlocked: true,
    notes: 'Embedding restricted by Bloomberg',
  },
  {
    name: 'CNBC',
    embedBlocked: true,
    notes: 'Embedding restricted by CNBC',
  },
  {
    name: 'Yahoo Finance',
    embedBlocked: true,
    notes: 'Embedding restricted by Yahoo Finance',
  },
] as const
