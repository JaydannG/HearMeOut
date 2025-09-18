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

        res.json(artists);
    } catch (error) {
        console.error("Error searching artists", error);
        res.status(500).json({ error: "Error searching artists" });
    }
});

// function to get the form post from the frontend
app.post('/submit-form', async (req, res) => {
    try {
        const artist = req.body.artist;
        const token = await getSpotifyToken();

        const searchRes = await axios.get(`${BASE_URL}/search`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { q: `artist:${artist}`, type: "track" },
        });

        const tracks = searchRes.data.tracks.items;
        if (tracks.length === 0) {
            return res.status(404).json({ error: "Could not find any tracks" });
        }

        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

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