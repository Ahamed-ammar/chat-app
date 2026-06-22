import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Profile = () => {
    const { user, token } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(true);

    useEffect(() => {
        if (!token) return;
        axios.get('/api/users/contacts', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setContacts(r.data))
            .catch(() => {})
            .finally(() => setLoadingContacts(false));
    }, [token]);

    const initials = (name) => name?.charAt(0)?.toUpperCase() || '?';

    return (
        <div className="canvas-bg">
            <div className="app-shell shadow-2xl">
                <Sidebar />

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="h-16 px-gutter flex items-center gap-3 bg-surface-container-lowest border-b border-outline-variant flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                        <h1 className="text-xl font-bold text-on-surface tracking-tight">Profile</h1>
                    </header>

                    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

                            {/* Profile card */}
                            <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] overflow-hidden">
                                {/* Cover strip */}
                                <div className="h-24 bg-gradient-to-r from-primary via-primary-container to-secondary-container" />

                                <div className="px-6 pb-6">
                                    {/* Avatar */}
                                    <div className="flex items-end justify-between -mt-8 mb-4">
                                        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg ring-4 ring-white">
                                            {initials(user?.username)}
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary text-xs font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-tertiary inline-block" />
                                            Online
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-on-surface">{user?.username}</h2>
                                    <p className="text-sm text-on-surface-variant mt-0.5">{user?.email}</p>

                                    <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-outline-variant/20">
                                        {[
                                            { label: 'Contacts',  value: contacts.length, icon: 'group'       },
                                            { label: 'Member',    value: 'Since today',   icon: 'calendar_month' },
                                            { label: 'Status',    value: 'Active',        icon: 'circle'      },
                                        ].map(({ label, value, icon }) => (
                                            <div key={label} className="text-center">
                                                <span className="material-symbols-outlined text-primary block mx-auto mb-1">{icon}</span>
                                                <p className="font-bold text-on-surface text-sm">{value}</p>
                                                <p className="text-xs text-on-surface-variant">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Account info */}
                            <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] divide-y divide-outline-variant/10">
                                <div className="px-6 py-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                                    <h3 className="font-bold text-on-surface">Account Details</h3>
                                </div>
                                {[
                                    { label: 'Username', value: user?.username, icon: 'badge'        },
                                    { label: 'Email',    value: user?.email,    icon: 'mail'         },
                                    { label: 'User ID',  value: user?.id ? `${user.id.slice(0, 8)}…` : '—', icon: 'tag' },
                                ].map(({ label, value, icon }) => (
                                    <div key={label} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-on-surface-variant text-lg">{icon}</span>
                                            <span className="text-sm text-on-surface-variant">{label}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-on-surface">{value || '—'}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Contacts list */}
                            <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] overflow-hidden">
                                <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary text-xl">contacts</span>
                                        <h3 className="font-bold text-on-surface">Contacts</h3>
                                    </div>
                                    <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                                        {contacts.length}
                                    </span>
                                </div>

                                {loadingContacts ? (
                                    <div className="flex justify-center py-8">
                                        <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-10 text-on-surface-variant">
                                        <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">person_off</span>
                                        <p className="text-sm">No contacts yet. Add someone via the Inbox.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-outline-variant/10">
                                        {contacts.map(c => (
                                            <div key={c.id} className="flex items-center gap-3 px-6 py-3 hover:bg-surface-container-low transition-colors">
                                                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm uppercase flex-shrink-0">
                                                    {initials(c.username)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-on-surface truncate">{c.username}</p>
                                                    <p className="text-xs text-on-surface-variant truncate">{c.email}</p>
                                                </div>
                                                <span className="w-2 h-2 rounded-full bg-tertiary flex-shrink-0" title="Online" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Profile;
