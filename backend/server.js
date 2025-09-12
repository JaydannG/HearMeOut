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
        new URLSearchParams({ grant_type: "client_credentials "}),
        {
            headers: {
                Authorization:
                    "Basic" +
                    Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data.access_token;
}

// function to get the form post from the frontend
app.post('/submit-form', (req, res) => {
    const artist = req.body.artist;
    console.log("Artist: ", artist);
    res.json({ message: `Received artist: ${artist}`});
});

app.listen(port, () => {
    console.log(`Server listening at http://loaclhost:${port}`);
});