import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MCP_ROOT = join(__dirname, '..')
const DEFAULT_PROJECT_ROOT = join(MCP_ROOT, '..', '..')

function projectRoot() {
  return process.env.SPOTIFY_MCP_PROJECT_ROOT || DEFAULT_PROJECT_ROOT
}

function isDeveloperMode() {
  const v = process.env.SPOTIFY_MCP_DEVELOPER
  return v === '1' || v === 'true' || v === 'yes'
}

function spotifyWebConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
}

let catalogCache = null
async function loadCatalog() {
  if (catalogCache) return catalogCache
  const raw = await readFile(join(MCP_ROOT, 'catalog.json'), 'utf8')
  catalogCache = JSON.parse(raw)
  return catalogCache
}

function flattenTracks(catalog) {
  const out = []
  for (const t of catalog.recentlyPlayed || []) {
    out.push({ ...t, section: 'recentlyPlayed' })
  }
  for (const t of catalog.featuredPlaylists || []) {
    out.push({ ...t, section: 'featuredPlaylists' })
  }
  for (const t of catalog.madeForYou || []) {
    out.push({ ...t, section: 'madeForYou' })
  }
  return out
}

async function spotifyClientCredentialsToken() {
  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) return null
  const body = new URLSearchParams({ grant_type: 'client_credentials' })
  const auth = Buffer.from(`${id}:${secret}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify token failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.access_token
}

async function spotifySearchTracks(query, limit = 5) {
  const token = await spotifyClientCredentialsToken()
  if (!token) return null
  const url = new URL('https://api.spotify.com/v1/search')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'track')
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify search failed: ${res.status} ${text}`)
  }
  return res.json()
}

const mcp = new McpServer(
  {
    name: 'spotify-mcp',
    version: '1.0.0',
  },
  {
    instructions:
      'Spotify MCP: local Music 2.0 / spotify-desktop-ui catalog (demo UI), optional Spotify Web API search when SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set. Set SPOTIFY_MCP_DEVELOPER=1 for extra diagnostics.',
  }
)

mcp.registerTool(
  'local_catalog_search',
  {
    title: 'Search local app catalog',
    description:
      'Search tracks and playlists in this repo’s Spotify-style UI (MainContent demo data). Does not call Spotify.',
    inputSchema: {
      query: z.string().describe('Substring to match against title or artist (case-insensitive)'),
      limit: z.number().int().min(1).max(50).optional().describe('Max results (default 15)'),
    },
  },
  async ({ query, limit = 15 }) => {
    const q = query.trim().toLowerCase()
    const catalog = await loadCatalog()
    const all = flattenTracks(catalog)
    const flat = q
      ? all.filter((t) => {
          const title = (t.title || '').toLowerCase()
          const artist = (t.artist || '').toLowerCase()
          return title.includes(q) || artist.includes(q)
        })
      : all
    const slice = flat.slice(0, limit)
    return {
      content: [{ type: 'text', text: JSON.stringify({ count: slice.length, items: slice }, null, 2) }],
    }
  }
)

mcp.registerTool(
  'local_list_sections',
  {
    title: 'List catalog sections',
    description: 'Return featured playlists, recently played, and made-for-you buckets from the local UI catalog.',
    inputSchema: {},
  },
  async () => {
    const catalog = await loadCatalog()
    return {
      content: [{ type: 'text', text: JSON.stringify(catalog, null, 2) }],
    }
  }
)

mcp.registerTool(
  'spotify_developer_status',
  {
    title: 'Developer mode status',
    description:
      'Reports SPOTIFY_MCP_DEVELOPER, project root, and whether Spotify Web API credentials are set (client credentials).',
    inputSchema: {},
  },
  async () => {
    const root = projectRoot()
    const payload = {
      developerMode: isDeveloperMode(),
      projectRoot: root,
      spotifyWebApiConfigured: spotifyWebConfigured(),
      hint: 'Set SPOTIFY_MCP_DEVELOPER=1 for read_env_template. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET for spotify_web_search.',
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    }
  }
)

mcp.registerTool(
  'spotify_web_search',
  {
    title: 'Spotify Web API — search tracks',
    description:
      'Search tracks on Spotify (requires Developer Dashboard app: SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET, client-credentials). Read-only; no user library.',
    inputSchema: {
      query: z.string().describe('Search query'),
      limit: z.number().int().min(1).max(20).optional().describe('Max tracks (default 5)'),
    },
  },
  async ({ query, limit = 5 }) => {
    if (!spotifyWebConfigured()) {
      return {
        content: [
          {
            type: 'text',
            text:
              'Missing SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET. Create an app at https://developer.spotify.com/dashboard and add credentials to the MCP env.',
          },
        ],
      }
    }
    try {
      const data = await spotifySearchTracks(query, limit)
      const tracks = (data.tracks?.items || []).map((t) => ({
        name: t.name,
        artists: (t.artists || []).map((a) => a.name),
        album: t.album?.name,
        preview_url: t.preview_url,
        external_urls: t.external_urls,
      }))
      return {
        content: [{ type: 'text', text: JSON.stringify({ query, tracks }, null, 2) }],
      }
    } catch (e) {
      return {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      }
    }
  }
)

mcp.registerTool(
  'read_env_template',
  {
    title: 'Read .env.example (developer)',
    description:
      'Returns contents of .env.example from the project root when SPOTIFY_MCP_DEVELOPER is enabled (no secret values).',
    inputSchema: {},
  },
  async () => {
    if (!isDeveloperMode()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Set environment variable SPOTIFY_MCP_DEVELOPER=1 on the MCP server to enable this tool.',
          },
        ],
      }
    }
    try {
      const text = await readFile(join(projectRoot(), '.env.example'), 'utf8')
      return { content: [{ type: 'text', text }] }
    } catch (e) {
      return {
        content: [{ type: 'text', text: `Could not read .env.example: ${e.message}` }],
        isError: true,
      }
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await mcp.connect(transport)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
