import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AddMemberModal = ({ room, onClose, onMemberAdded }) => {
    const { token } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(null); // userId being added
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    // IDs of users already in the room
    const memberIds = new Set(room.members?.map(m => m.user?.id ?? m.userId) ?? []);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await axios.get('/api/users/contacts', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setContacts(res.data);
            } catch {
                setError('Failed to load contacts.');
            } finally {
                setLoading(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        };
        fetchContacts();
    }, [token]);

    const filtered = contacts.filter(c =>
        !memberIds.has(c.id) &&
        (c.username.toLowerCase().includes(query.toLowerCase()) ||
         c.email.toLowerCase().includes(query.toLowerCase()))
    );

    const handleAdd = async (contact) => {
        setAdding(contact.id);
        setError('');
        try {
            await axios.post(
                `/api/rooms/${room.id}/members`,
                { userId: contact.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onMemberAdded(contact);
            // Remove from available list instantly
            setContacts(prev => prev.filter(c => c.id !== contact.id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member.');
        } finally {
            setAdding(null);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const alreadyAllAdded = !loading && contacts.filter(c => !memberIds.has(c.id)).length === 0 && !query;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-on-surface text-base leading-tight">Add to Room</h2>
                            <p className="text-xs text-on-surface-variant truncate max-w-[200px]">{room.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 pt-5 pb-3">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-body-sm focus:ring-2 focus:ring-primary-container focus:border-transparent outline-none transition-all"
                            placeholder="Filter contacts..."
                            type="text"
                        />
                    </div>
                    {error && (
                        <p className="text-xs text-error mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </p>
                    )}
                </div>

                {/* Contact list */}
                <div className="px-3 pb-4 max-h-72 overflow-y-auto custom-scrollbar">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    )}

                    {!loading && alreadyAllAdded && (
                        <div className="text-center py-8 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">group_off</span>
                            <p className="text-sm">All your contacts are already in this room</p>
                        </div>
                    )}

                    {!loading && contacts.length === 0 && (
                        <div className="text-center py-8 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">person_off</span>
                            <p className="text-sm">You have no contacts yet</p>
                            <p className="text-xs mt-1">Add contacts via the <span className="font-semibold">person_add</span> button first</p>
                        </div>
                    )}

                    {!loading && filtered.length === 0 && query && (
                        <div className="text-center py-8 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">search_off</span>
                            <p className="text-sm">No contacts match "{query}"</p>
                        </div>
                    )}

                    {filtered.map(contact => {
                        const isAdding = adding === contact.id;
                        return (
                            <div
                                key={contact.id}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm uppercase flex-shrink-0">
                                    {contact.username.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-on-surface text-sm truncate">{contact.username}</p>
                                    <p className="text-xs text-on-surface-variant truncate">{contact.email}</p>
                                </div>
                                <button
                                    onClick={() => handleAdd(contact)}
                                    disabled={isAdding}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    {isAdding ? (
                                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                                    )}
                                    {isAdding ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Current members pill list */}
                {room.members && room.members.length > 0 && (
                    <div className="px-6 pb-5 pt-1 border-t border-outline-variant">
                        <p className="text-xs font-semibold text-on-surface-variant mb-2">
                            Current members ({room.members.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {room.members.map(m => {
                                const name = m.user?.username ?? m.username ?? '?';
                                return (
                                    <span
                                        key={m.user?.id ?? m.userId}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant"
                                    >
                                        <span className="w-4 h-4 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-[9px] uppercase">
                                            {name.charAt(0)}
                                        </span>
                                        {name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMemberModal;
