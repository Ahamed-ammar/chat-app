import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import InboxPane from '../components/InboxPane';
import ChatCanvas from '../components/ChatCanvas';
import AddContactModal from '../components/AddContactModal';

// ── Room enrichment helper ─────────────────────────────────────────────────────

const enrichRoom = (room, currentUserId) => {
    let dmPartnerName = null;
    if (room.isDirect && room.members) {
        const partner = room.members.find(m => m.user.id !== currentUserId);
        dmPartnerName = partner?.user?.username || room.name;
    }
    const lastMsg = room.messages?.[0] ?? null;
    const lastMessageAt = lastMsg ? new Date(lastMsg.createdAt) : new Date(room.createdAt);
    return { ...room, dmPartnerName, lastMessageAt, lastMessage: lastMsg };
};

// ── Component ──────────────────────────────────────────────────────────────────

const Chat = () => {
    const { token, user } = useAuth();
    const { stompClient, connected } = useSocket();  // STOMP replaces socket.io
    const { state: locationState } = useLocation();

    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [messages, setMessages] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [showAddContact, setShowAddContact] = useState(false);

    // Refs so stable callbacks always read current values
    const activeRoomIdRef  = useRef(activeRoomId);
    const messagesRef      = useRef(messages);
    const stompRef         = useRef(stompClient);
    const tokenRef         = useRef(token);
    // Tracks STOMP subscriptions by roomId so we can unsubscribe on room leave
    const subscriptionsRef = useRef({});

    useEffect(() => { activeRoomIdRef.current  = activeRoomId; },  [activeRoomId]);
    useEffect(() => { messagesRef.current      = messages; },      [messages]);
    useEffect(() => { stompRef.current         = stompClient; },   [stompClient]);
    useEffect(() => { tokenRef.current         = token; },         [token]);

    const activeMessages = activeRoomId ? (messages[activeRoomId] || []) : [];

    const sortedRooms = [...rooms].sort(
        (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );

    // ── Fetch rooms on load ──────────────────────────────────────────────────

    useEffect(() => {
        if (!user) return;
        axios.get('/api/rooms', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setRooms(res.data.map(r => enrichRoom(r, user.id))))
            .catch(err => console.error('Failed to fetch rooms', err));
    }, [token, user]);

    // ── Stable room selector — uses refs, never stale ────────────────────────

    const handleSelectRoom = useCallback(async (roomId) => {
        const prevRoomId    = activeRoomIdRef.current;
        const stomp         = stompRef.current;
        const currentToken  = tokenRef.current;
        const currentMsgs   = messagesRef.current;
        const subs          = subscriptionsRef.current;

        if (prevRoomId === roomId) return;

        // Unsubscribe from previous room's topics
        if (prevRoomId) {
            subs[prevRoomId]?.message?.unsubscribe();
            subs[prevRoomId]?.typing?.unsubscribe();
            delete subs[prevRoomId];
        }

        setActiveRoomId(roomId);

        // Subscribe to new room's topics once STOMP is connected
        if (stomp?.connected) {
            // /topic/room.{roomId}         → new_message  (replaces socket.on('new_message'))
            const msgSub = stomp.subscribe(`/topic/room.${roomId}`, (frame) => {
                const msg = JSON.parse(frame.body);
                setMessages(prev => {
                    const roomMsgs = prev[msg.roomId] || [];
                    if (roomMsgs.find(m => m.id === msg.id)) return prev;
                    return {
                        ...prev,
                        [msg.roomId]: [...roomMsgs, msg].sort(
                            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                        )
                    };
                });
                // Bubble room to top
                setRooms(prev => prev.map(r =>
                    r.id === msg.roomId
                        ? { ...r, lastMessageAt: new Date(msg.createdAt), lastMessage: msg }
                        : r
                ));
            });

            // /topic/room.{roomId}.typing  → user_typing  (replaces socket.on('user_typing'))
            const typingSub = stomp.subscribe(`/topic/room.${roomId}.typing`, (frame) => {
                const { userId } = JSON.parse(frame.body);
                const currentRoomId = activeRoomIdRef.current;
                setTypingUsers(prev => ({
                    ...prev,
                    [currentRoomId]: { ...(prev[currentRoomId] || {}), [userId]: Date.now() }
                }));
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const updated = { ...prev };
                        if (updated[currentRoomId]?.[userId]) {
                            delete updated[currentRoomId][userId];
                        }
                        return updated;
                    });
                }, 3000);
            });

            subs[roomId] = { message: msgSub, typing: typingSub };
        }

        // Fetch message history if not cached
        if (!currentMsgs[roomId]) {
            try {
                const res = await axios.get(`/api/rooms/${roomId}/messages`, {
                    headers: { Authorization: `Bearer ${currentToken}` }
                });
                setMessages(prev => ({ ...prev, [roomId]: res.data.reverse() }));
            } catch (err) {
                console.error('Failed to fetch messages', err);
            }
        }
    }, []); // stable — reads via refs

    // Re-subscribe to active room if STOMP connects after room was already selected
    useEffect(() => {
        if (!connected || !activeRoomId) return;
        const subs = subscriptionsRef.current;
        if (subs[activeRoomId]) return; // already subscribed

        const stomp = stompRef.current;

        const msgSub = stomp.subscribe(`/topic/room.${activeRoomId}`, (frame) => {
            const msg = JSON.parse(frame.body);
            setMessages(prev => {
                const roomMsgs = prev[msg.roomId] || [];
                if (roomMsgs.find(m => m.id === msg.id)) return prev;
                return {
                    ...prev,
                    [msg.roomId]: [...roomMsgs, msg].sort(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                    )
                };
            });
            setRooms(prev => prev.map(r =>
                r.id === msg.roomId
                    ? { ...r, lastMessageAt: new Date(msg.createdAt), lastMessage: msg }
                    : r
            ));
        });

        const typingSub = stomp.subscribe(`/topic/room.${activeRoomId}.typing`, (frame) => {
            const { userId } = JSON.parse(frame.body);
            const currentRoomId = activeRoomIdRef.current;
            setTypingUsers(prev => ({
                ...prev,
                [currentRoomId]: { ...(prev[currentRoomId] || {}), [userId]: Date.now() }
            }));
            setTimeout(() => {
                setTypingUsers(prev => {
                    const updated = { ...prev };
                    if (updated[currentRoomId]?.[userId]) delete updated[currentRoomId][userId];
                    return updated;
                });
            }, 3000);
        });

        subs[activeRoomId] = { message: msgSub, typing: typingSub };
    }, [connected, activeRoomId]);

    // ── Navigation state: open room from Groups/Dashboard ───────────────────

    const openedFromNav = useRef(false);
    useEffect(() => {
        if (openedFromNav.current) return;
        if (locationState?.openRoomId && rooms.length > 0) {
            const target = rooms.find(r => r.id === locationState.openRoomId);
            if (target) {
                openedFromNav.current = true;
                handleSelectRoom(locationState.openRoomId);
            }
        }
    }, [locationState, rooms]);

    // ── Create group room ────────────────────────────────────────────────────

    const handleCreateRoom = async (name) => {
        try {
            const res = await axios.post('/api/rooms', { name }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newRoom = enrichRoom(res.data, user.id);
            setRooms(prev => [newRoom, ...prev]);
            handleSelectRoom(newRoom.id);
        } catch (err) {
            console.error('Failed to create room', err);
        }
    };

    // ── Send message via STOMP ───────────────────────────────────────────────
    // Replaces: socket.emit('send_message', { roomId, content })
    // Spring receives at: @MessageMapping("/chat.send")

    const handleSendMessage = (content) => {
        const stomp = stompRef.current;
        if (!activeRoomId || !stomp?.connected) return;

        stomp.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({ roomId: activeRoomId, content }),
        });
    };

    // ── Send typing indicator via STOMP ──────────────────────────────────────
    // Replaces: socket.emit('typing', { roomId })
    // Spring receives at: @MessageMapping("/chat.typing")

    const handleTyping = useCallback(() => {
        const stomp = stompRef.current;
        if (!activeRoomIdRef.current || !stomp?.connected) return;
        stomp.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({ roomId: activeRoomIdRef.current }),
        });
    }, []);

    // ── Add member to room ───────────────────────────────────────────────────

    const handleRoomMemberAdded = useCallback((roomId, contact) => {
        setRooms(prev => prev.map(r => {
            if (r.id !== roomId) return r;
            const newMember = { userId: contact.id, user: contact };
            const alreadyIn = r.members?.some(m => (m.user?.id ?? m.userId) === contact.id);
            if (alreadyIn) return r;
            return { ...r, members: [...(r.members ?? []), newMember] };
        }));
    }, []);

    // ── Start direct chat (from AddContactModal) ─────────────────────────────

    const handleStartDirectChat = useCallback((room, partnerUser) => {
        const enriched = enrichRoom({ ...room, dmPartnerName: partnerUser.username }, user?.id);
        setRooms(prev => {
            const exists = prev.find(r => r.id === room.id);
            if (exists) return prev.map(r => r.id === room.id ? enriched : r);
            return [enriched, ...prev];
        });
        setTimeout(() => handleSelectRoom(room.id), 0);
    }, [user, handleSelectRoom]);

    const activeRoom = rooms.find(r => r.id === activeRoomId);

    return (
        <div className="canvas-bg">
            <div className="app-shell shadow-2xl relative">
                <Sidebar />
                <InboxPane
                    rooms={sortedRooms}
                    activeRoomId={activeRoomId}
                    onSelectRoom={handleSelectRoom}
                    onCreateRoom={handleCreateRoom}
                    onAddContact={() => setShowAddContact(true)}
                />
                <ChatCanvas
                    activeRoom={activeRoom}
                    messages={activeMessages}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    typingUsers={typingUsers[activeRoomId]}
                    onRoomMemberAdded={handleRoomMemberAdded}
                />
            </div>
            {showAddContact && (
                <AddContactModal
                    onClose={() => setShowAddContact(false)}
                    onStartChat={handleStartDirectChat}
                />
            )}
        </div>
    );
};

export default Chat;
