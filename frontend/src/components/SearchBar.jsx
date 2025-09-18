import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/SearchBar.css';

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);

    // Debounced search function
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (query.length >= 2) {
            setLoading(true);
            timeoutRef.current = setTimeout(async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/search-artists?q=${encodeURIComponent(query)}`);
                    setSuggestions(response.data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                } finally {
                    setLoading(false);
                }
            }, 300); // 300ms delay
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        setSelectedIndex(-1);
    };

    const handleSuggestionClick = (artist) => {
        setQuery(artist.name);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const handleArtistSelect = (artist) => {
        // Navigate with both artist name and ID
        navigate(`/game?artist=${encodeURIComponent(artist.name)}&artistId=${encodeURIComponent(artist.id)}`);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else if (query.trim()) {
                    handleSubmit(e);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (query.trim()) {
            // If there's a selected suggestion, use its ID
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                const selectedArtist = suggestions[selectedIndex];
                handleArtistSelect(selectedArtist);
            } else {
                // Fallback to name-only search
                navigate(`/game?artist=${encodeURIComponent(query)}`);
            }
        }
    };

    const handleBlur = () => {
        // Delay hiding suggestions to allow clicks on suggestions
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <div className="search-container">
            <form className="search-form" onSubmit={handleSubmit}>
                <div className="search-input-container">
                    <input 
                        ref={inputRef}
                        type="search" 
                        value={query} 
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                        onBlur={handleBlur}
                        placeholder="Search for an artist..."
                        className="search-input"
                    />
                    {loading && (
                        <div className="loading-indicator">
                            Loading...
                        </div>
                    )}
                </div>
                <button 
                    type="submit" 
                    className="search-button"
                >
                    Play Game
                </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-container">
                    {suggestions.map((artist, index) => (
                        <div
                            key={artist.id}
                            onClick={() => handleArtistSelect(artist)}
                            className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                        >
                            {artist.image && (
                                <img 
                                    src={artist.image} 
                                    alt={artist.name}
                                    className="artist-image"
                                />
                            )}
                            <div className="artist-info">
                                <div className="artist-name">
                                    {artist.name}
                                </div>
                                {artist.genres.length > 0 && (
                                    <div className="artist-genres">
                                        {artist.genres.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}