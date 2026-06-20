import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AddContactModal = ({ onClose, onStartChat }) => {
    const { token } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSearch = (value) => {
        setQuery(value);
        setError('');
        clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/users/search?q=${encodeURIComponent(value)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResults(res.data);
            } catch (err) {
                setError('Search failed. Please try again.');
            } finally {
                setLoading(false);
            }
        }, 350);
    };

    const handleSelect = async (user) => {
        try {
            const res = await axios.post('/api/rooms/direct', { targetUserId: user.id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onStartChat(res.data, user);
            onClose();
        } catch (err) {
            setError('Could not open chat. Please try again.');
        }
    };

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                        </div>
                        <h2 className="font-bold text-on-surface text-lg">Add Contact</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Search input */}
                <div className="px-6 pt-5 pb-3">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-body-sm focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all"
                            placeholder="Search by username or email..."
                            type="text"
                        />
                        {loading && (
                            <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                    </div>
                    {error && (
                        <p className="text-xs text-error mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </p>
                    )}
                </div>

                {/* Results */}
                <div className="px-3 pb-4 max-h-72 overflow-y-auto custom-scrollbar">
                    {results.length === 0 && query.trim() && !loading && (
                        <div className="text-center py-8 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">person_search</span>
                            <p className="text-sm">No users found for "{query}"</p>
                        </div>
                    )}
                    {!query.trim() && (
                        <div className="text-center py-8 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">group_search</span>
                            <p className="text-sm">Type a name or email to find someone</p>
                        </div>
                    )}
                    {results.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm uppercase flex-shrink-0">
                                {user.username.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-on-surface text-sm truncate">{user.username}</p>
                                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xl">
                                chat_bubble
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddContactModal;
