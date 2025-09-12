import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (query.trim()) {
            navigate(`/game?artist=${encodeURIComponent(query)}`)
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter an artist"/>
            <button type="submit">Play</button>
        </form>
    );
}