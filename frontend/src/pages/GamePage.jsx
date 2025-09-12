import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function GamepPage() {
    const [params] = useSearchParams();
    const artist = params.get('artist');

    const [track, setTrack] = useState(null);
    const [guess, setGuess] = useState("");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        async function getTrack() {
            try {
                const response = await axios.post("http://localhost:5000/submit-form", {
                    artist,
                });

                setTrack(response.data);
            } catch (error) {
                console.error(error);
            }
        }
        getTrack();
    }, [artist]);

    const handleGuess = (e) => {
        e.preventDefault();
        if (!track) return;

        if (guess.toLowerCase().trim === track.track.toLowerCase()) {
            setFeedback("Correct");
        } else {
            setFeedback("Wrong");
        }
    };

    return (
        <div>
            <h2>Guess the Song</h2>
            <h3>{track.track}</h3>

            {!track ? (
                <p>Loading track...</p>
            ) : (
                <>
                    {track.preview_url ? (
                        <audio controls src={track.preview_url}></audio>
                    ) : (
                        <p>No preview available for this track.</p>
                    )}

                    <form onSubmit={handleGuess} style={{ marginTop: "1rem" }}>
                        <input
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            placeholder="Enter your guess"
                        />
                        <button type="submit">Submit Guess</button>
                    </form>

                    {feedback && <p>{feedback}</p>}
                </>
            )}
        </div>
    );
}