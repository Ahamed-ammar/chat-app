import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Groups = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) return;
        axios.get('/api/rooms', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => setGroups(r.data.filter(rm => !rm.isDirect)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post('/api/rooms', { name: newName.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(prev => [res.data, ...prev]);
            setNewName('');
            setCreating(false);
        } catch {}
        finally { setSubmitting(false); }
    };

    const goToChat = (roomId) => navigate('/', { state: { openRoomId: roomId } });

    return (
        <div className="canvas-bg">
            <div className="app-shell shadow-2xl">
                <Sidebar />

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="h-16 px-gutter flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                            <h1 className="text-xl font-bold text-on-surface tracking-tight">Groups</h1>
                        </div>
                        <button
                            onClick={() => setCreating(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">{creating ? 'close' : 'add'}</span>
                            {creating ? 'Cancel' : 'New Group'}
                        </button>
                    </header>

                    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

                            {/* Create form */}
                            {creating && (
                                <form onSubmit={handleCreate} className="bg-white border border-outline-variant/30 rounded-[1.25rem] p-5 flex gap-3">
                                    <input
                                        autoFocus
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="Group name..."
                                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-container"
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting || !newName.trim()}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                                    >
                                        {submitting ? 'Creating…' : 'Create'}
                                    </button>
                                </form>
                            )}

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Groups', value: groups.length,                                                    icon: 'group',         color: 'primary'   },
                                    { label: 'My Groups',    value: groups.filter(g => g.members?.some(m => m.user?.id === user?.id)).length, icon: 'group_work', color: 'secondary' },
                                    { label: 'Total Members',value: groups.reduce((a, g) => a + (g.members?.length ?? 0), 0),          icon: 'people',        color: 'tertiary'  },
                                ].map(({ label, value, icon, color }) => (
                                    <div key={label} className="bg-white border border-outline-variant/30 rounded-2xl p-4 text-center">
                                        <span className={`material-symbols-outlined text-${color} text-2xl block mb-1`}>{icon}</span>
                                        <p className="text-xl font-bold text-on-surface">{value}</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Group list */}
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="text-center py-16 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-5xl opacity-30 block mb-3">group_off</span>
                                    <p className="font-semibold">No groups yet</p>
                                    <p className="text-sm mt-1">Create one above or join from the Inbox.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {groups.map(group => {
                                        const memberCount = group.members?.length ?? 0;
                                        const lastMsg = group.messages?.[0];
                                        return (
                                            <div
                                                key={group.id}
                                                onClick={() => goToChat(group.id)}
                                                className="bg-white border border-outline-variant/30 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
                                            >
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-primary font-bold text-lg uppercase flex-shrink-0">
                                                    {group.name.charAt(0)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-on-surface truncate">{group.name}</p>
                                                    <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                                                        {lastMsg
                                                            ? `${lastMsg.sender?.username ?? 'Someone'}: ${lastMsg.content}`
                                                            : 'No messages yet'}
                                                    </p>
                                                </div>

                                                {/* Meta */}
                                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                                        <span className="material-symbols-outlined text-[14px]">group</span>
                                                        {memberCount}
                                                    </span>
                                                    <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors">
                                                        chevron_right
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Groups;
