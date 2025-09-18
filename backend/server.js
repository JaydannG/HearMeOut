const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

const BASE_URL = "https://api.spotify.com/v1";
const port = 5000;

require('dotenv').config();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// function to get spotify token to make API call
async function getSpotifyToken() {
    const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data.access_token;
}

// function to search for artists (autocomplete)
app.get('/search-artists', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.json([]);
        }

        const token = await getSpotifyToken();
        const searchRes = await axios.get(`${BASE_URL}/search`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { q: query, type: "artist", limit: 10 },
        });

        const artists = searchRes.data.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            popularity: artist.popularity,
            genres: artist.genres.slice(0, 3), // Limit to first 3 genres
            image: artist.images.length > 0 ? artist.images[0].url : null
        }));

        console.log(`Search results for "${query}":`, artists.map(a => `${a.name} (ID: ${a.id}, Popularity: ${a.popularity})`));
        res.json(artists);
    } catch (error) {
        console.error("Error searching artists", error);
        res.status(500).json({ error: "Error searching artists" });
    }
});

// function to get the form post from the frontend
app.post('/submit-form', async (req, res) => {
    try {
        const { artist, artistId } = req.body;
        console.log(`Received request - Artist: "${artist}", ArtistID: "${artistId}"`);
        
        const token = await getSpotifyToken();

        let tracks;
        
        if (artistId) {
            console.log(`Using artist ID: ${artistId}`);
            
            // Get both top tracks and albums for more variety
            const [topTracksRes, albumsRes] = await Promise.all([
                // Get top tracks
                axios.get(`${BASE_URL}/artists/${artistId}/top-tracks`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { market: 'US' },
                }),
                // Get artist's albums
                axios.get(`${BASE_URL}/artists/${artistId}/albums`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { 
                        market: 'US',
                        limit: 20,
                        include_groups: 'album,single,compilation'
                    },
                })
            ]);
            
            const topTracks = topTracksRes.data.tracks;
            const albums = albumsRes.data.items;
            
            // Get tracks from a few random albums for variety
            const albumTracks = [];
            const randomAlbums = albums.slice(0, 3); // Get tracks from first 3 albums
            
            for (const album of randomAlbums) {
                try {
                    const albumTracksRes = await axios.get(`${BASE_URL}/albums/${album.id}/tracks`, {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { market: 'US', limit: 10 },
                    });
                    
                    // Add album info to each track
                    const tracksWithAlbum = albumTracksRes.data.items.map(track => ({
                        ...track,
                        album: {
                            name: album.name,
                            id: album.id,
                            images: album.images
                        }
                    }));
                    
                    albumTracks.push(...tracksWithAlbum);
                } catch (error) {
                    console.log(`Error fetching tracks from album ${album.name}:`, error.message);
                }
            }
            
            // Combine top tracks and album tracks, remove duplicates
            const allTracks = [...topTracks];
            const existingTrackIds = new Set(topTracks.map(track => track.id));
            
            albumTracks.forEach(track => {
                if (!existingTrackIds.has(track.id)) {
                    allTracks.push(track);
                    existingTrackIds.add(track.id);
                }
            });
            
            tracks = allTracks;
            console.log(`Found ${tracks.length} tracks for artist ID ${artistId} (${topTracks.length} top tracks + ${albumTracks.length} album tracks)`);
        } else {
            console.log(`No artist ID provided, using name search for: "${artist}"`);
            // Fallback to artist name search
            const searchRes = await axios.get(`${BASE_URL}/search`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { q: `artist:"${artist}"`, type: "track", limit: 50 },
            });
            tracks = searchRes.data.tracks.items;
            console.log(`Found ${tracks.length} tracks for artist name "${artist}"`);
        }

        if (tracks.length === 0) {
            return res.status(404).json({ error: "Could not find any tracks" });
        }

        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        console.log(`Selected track: "${randomTrack.name}" by ${randomTrack.artists[0].name}`);

        res.json({
            artist: artist,
            track: randomTrack.name,
            album: randomTrack.album,
        });
    } catch (error) {
        console.error("Error fetching from Spotify", error);
        res.status(500).json({ error: "Error with Spotify API"});
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});