import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function GamePage() {
    const [params] = useSearchParams();
    const artist = params.get('artist');

    const [track, setTrack] = useState(null);
    const [guess, setGuess] = useState("");
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function getTrack() {
            try {
                setLoading(true);
                setError(null);
                console.log("Fetching track for artist:", artist);
                const response = await axios.post("http://localhost:5000/submit-form", {
                    artist,
                });

                console.log("Response received:", response.data);
                setTrack(response.data);
            } catch (error) {
                console.error("Error fetching track:", error);
                setError("Failed to load track. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        if (artist) {
            getTrack();
        } else {
            console.log("No artist found in URL params");
        }
    }, [artist]);

    const handleGuess = (e) => {
        e.preventDefault();
        if (!track) return;

        if (guess.toLowerCase().trim() === track.track.toLowerCase()) {
            setFeedback("Correct");
        } else {
            setFeedback("Wrong");
        }
    };

    console.log("GamePage render - artist:", artist, "loading:", loading, "error:", error, "track:", track);

    return (
        <div>
            <h2>Guess the Song</h2>
            <p>Debug: Artist = {artist || 'undefined'}</p>
            <p>Debug: Loading = {loading.toString()}</p>
            <p>Debug: Error = {error || 'none'}</p>
            <p>Debug: Track = {track ? 'loaded' : 'null'}</p>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <div>
                    <p style={{color: 'red'}}>{error}</p>
                    <button onClick={() => window.location.href = '/'}>Back to Search</button>
                </div>
            ) : track ? (
                <div>
                    <h3>{track.track}</h3>
                    <p>by {track.artist}</p>
                    <p>from {track.album.name}</p>
                    <form onSubmit={handleGuess}>
                        <input 
                            type="text" 
                            value={guess} 
                            onChange={(e) => setGuess(e.target.value)} 
                            placeholder="Guess the song name"
                        />
                        <button type="submit">Submit Guess</button>
                    </form>
                    {feedback && <p>{feedback}</p>}
                </div>
            ) : (
                <p>No track found for this artist.</p>
            )}
        </div>
    );
}