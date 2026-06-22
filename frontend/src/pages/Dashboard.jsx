import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        Promise.all([
            axios.get('/api/rooms',          { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('/api/users/contacts', { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(([roomsRes, contactsRes]) => {
                setRooms(roomsRes.data);
                setContacts(contactsRes.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    const dms     = rooms.filter(r => r.isDirect);
    const groups  = rooms.filter(r => !r.isDirect);
    const recentRooms = [...rooms]
        .sort((a, b) => {
            const aT = a.messages?.[0]?.createdAt ?? a.createdAt;
            const bT = b.messages?.[0]?.createdAt ?? b.createdAt;
            return new Date(bT) - new Date(aT);
        })
        .slice(0, 5);

    const goToChat = (roomId) => navigate('/', { state: { openRoomId: roomId } });

    const StatCard = ({ icon, label, value, color }) => (
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div>
                <p className="text-2xl font-bold text-on-surface">{value}</p>
                <p className="text-xs text-on-surface-variant">{label}</p>
            </div>
        </div>
    );

    return (
        <div className="canvas-bg">
            <div className="app-shell shadow-2xl">
                <Sidebar />

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="h-16 px-gutter flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>view_quilt</span>
                            <div>
                                <h1 className="text-xl font-bold text-on-surface leading-tight">Dashboard</h1>
                                <p className="text-xs text-on-surface-variant">Welcome back, {user?.username}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            Open Inbox
                        </button>
                    </header>

                    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

                            {loading ? (
                                <div className="flex justify-center py-16">
                                    <svg className="animate-spin h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : (
                                <>
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <StatCard icon="forum"    label="Total Rooms"  value={rooms.length}    color="primary"   />
                                        <StatCard icon="group"    label="Groups"       value={groups.length}   color="secondary" />
                                        <StatCard icon="chat"     label="Direct Chats" value={dms.length}      color="tertiary"  />
                                        <StatCard icon="contacts" label="Contacts"     value={contacts.length} color="primary"   />
                                    </div>

                                    {/* Recent activity */}
                                    <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] overflow-hidden">
                                        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">history</span>
                                                <h2 className="font-bold text-on-surface">Recent Activity</h2>
                                            </div>
                                            <button onClick={() => navigate('/')} className="text-primary text-xs font-bold hover:underline">
                                                View all
                                            </button>
                                        </div>
                                        {recentRooms.length === 0 ? (
                                            <div className="text-center py-10 text-on-surface-variant">
                                                <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">inbox</span>
                                                <p className="text-sm">No conversations yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-outline-variant/10">
                                                {recentRooms.map(room => {
                                                    const displayName = room.isDirect && room.members
                                                        ? room.members.find(m => m.user?.id !== user?.id)?.user?.username ?? room.name
                                                        : room.name;
                                                    const lastMsg = room.messages?.[0];
                                                    return (
                                                        <div
                                                            key={room.id}
                                                            onClick={() => goToChat(room.id)}
                                                            className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-container-low transition-colors cursor-pointer group"
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 ${room.isDirect ? 'bg-primary-fixed text-primary' : 'bg-primary-container text-primary'}`}>
                                                                {displayName.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="font-semibold text-sm text-on-surface truncate">{displayName}</p>
                                                                    {room.isDirect
                                                                        ? <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                                                        : <span className="material-symbols-outlined text-[12px] text-secondary">group</span>
                                                                    }
                                                                </div>
                                                                <p className="text-xs text-on-surface-variant truncate">
                                                                    {lastMsg ? `${lastMsg.sender?.username}: ${lastMsg.content}` : 'No messages yet'}
                                                                </p>
                                                            </div>
                                                            <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors text-xl">
                                                                chevron_right
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contacts quick-view */}
                                    {contacts.length > 0 && (
                                        <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] overflow-hidden">
                                            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">contacts</span>
                                                    <h2 className="font-bold text-on-surface">Contacts</h2>
                                                </div>
                                                <button onClick={() => navigate('/profile')} className="text-primary text-xs font-bold hover:underline">
                                                    View all
                                                </button>
                                            </div>
                                            <div className="p-4 flex flex-wrap gap-3">
                                                {contacts.slice(0, 8).map(c => (
                                                    <div key={c.id} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => navigate('/')}>
                                                        <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm uppercase ring-2 ring-white group-hover:ring-primary transition-all">
                                                            {c.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-[10px] font-medium text-on-surface-variant max-w-[48px] truncate text-center">
                                                            {c.username}
                                                        </span>
                                                    </div>
                                                ))}
                                                {contacts.length > 8 && (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold">
                                                            +{contacts.length - 8}
                                                        </div>
                                                        <span className="text-[10px] text-on-surface-variant">more</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
