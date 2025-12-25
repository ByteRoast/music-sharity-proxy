/*
 * Music Sharity Proxy - Cloudflare Worker Proxy
 * Copyright (C) 2025 Sikelio (Byte Roast)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
addEventListener('fetch', e => {
    e.respondWith(handleRequest(e.request))
});

async function handleRequest(request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Privacy-Policy': 'no-tracking',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed. Use GET.' }), 
            {
                status: 405,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                }
            }
        );
    }

    const url = new URL(request.url);
    const musicUrl = url.searchParams.get('url');

    if (!musicUrl) {
        return new Response(
            JSON.stringify({ 
                error: 'Missing "url" parameter',
                usage: 'GET /?url=https://open.spotify.com/track/...'
            }), 
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                }
            }
        );
    }

    try {
        const odesliUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(musicUrl)}`;
        
        const response = await fetch(odesliUrl, {
            headers: {
                'User-Agent': 'MusicSharity/1.0 (Privacy-First Music Link Converter)',
            },
            cf: {
                cacheTtl: 3600,
                cacheEverything: true,
            }
        });

        const data = await response.text();
        
        return new Response(data, {
            status: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                'X-Content-Source': 'odesli-api',
            }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ 
                error: 'Failed to fetch from music API',
                message: 'Please try again or check if the URL is valid'
            }), 
            {
                status: 500,
                headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                }
            }
        );
    }
}
