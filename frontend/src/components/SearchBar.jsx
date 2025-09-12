import { useState } from 'react';
import axios from 'axios';

export default function SearchBar() {
    const [query, setQuery] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost:5000/submit-form", {
                artist: query,
            });

            console.log("Server response: ", response);
        } catch (error) {
            console.error("Error submitting form: ", error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter an artist"/>
            <button type="submit">Search</button>
        </form>
    );
}