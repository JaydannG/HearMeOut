import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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
            navigate(`/game?artist=${encodeURIComponent(query)}`);
        }
    };

    const handleBlur = () => {
        // Delay hiding suggestions to allow clicks on suggestions
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <form onSubmit={handleSubmit}>
                <div style={{ position: 'relative' }}>
                    <input 
                        ref={inputRef}
                        type="search" 
                        value={query} 
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                        onBlur={handleBlur}
                        placeholder="Search for an artist..."
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '16px',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666'
                        }}>
                            Loading...
                        </div>
                    )}
                </div>
                <button 
                    type="submit" 
                    style={{
                        marginTop: '12px',
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: '#1db954',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Play Game
                </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {suggestions.map((artist, index) => (
                        <div
                            key={artist.id}
                            onClick={() => handleSuggestionClick(artist)}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                backgroundColor: index === selectedIndex ? '#f0f0f0' : 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            {artist.image && (
                                <img 
                                    src={artist.image} 
                                    alt={artist.name}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            )}
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {artist.name}
                                </div>
                                {artist.genres.length > 0 && (
                                    <div style={{ fontSize: '12px', color: '#666' }}>
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