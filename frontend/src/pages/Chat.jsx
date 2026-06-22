import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import InboxPane from '../components/InboxPane';
import ChatCanvas from '../components/ChatCanvas';
import AddContactModal from '../components/AddContactModal';

// Attach display name and lastMessageAt to a room
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

const Chat = () => {
    const { token, user } = useAuth();
    const { socket } = useSocket();
    const { state: locationState } = useLocation();
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [messages, setMessages] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [showAddContact, setShowAddContact] = useState(false);

    // Refs so callbacks always read the latest values without needing to be re-created
    const activeRoomIdRef = useRef(activeRoomId);
    const messagesRef = useRef(messages);
    const socketRef = useRef(socket);
    const tokenRef = useRef(token);

    useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { socketRef.current = socket; }, [socket]);
    useEffect(() => { tokenRef.current = token; }, [token]);

    const activeMessages = activeRoomId ? (messages[activeRoomId] || []) : [];

    // Sort rooms by most recent message descending (WhatsApp-style)
    const sortedRooms = [...rooms].sort(
        (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );

    // Fetch rooms on load
    useEffect(() => {
        if (!user) return;
        const fetchRooms = async () => {
            try {
                const res = await axios.get('/api/rooms', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRooms(res.data.map(r => enrichRoom(r, user.id)));
            } catch (err) {
                console.error('Failed to fetch rooms', err);
            }
        };
        fetchRooms();
    }, [token, user]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const onNewMessage = (msg) => {
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

            // Bubble the room to the top
            setRooms(prev =>
                prev.map(r =>
                    r.id === msg.roomId
                        ? { ...r, lastMessageAt: new Date(msg.createdAt), lastMessage: msg }
                        : r
                )
            );
        };

        const onUserTyping = ({ userId }) => {
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
        };

        socket.on('new_message', onNewMessage);
        socket.on('user_typing', onUserTyping);
        return () => {
            socket.off('new_message', onNewMessage);
            socket.off('user_typing', onUserTyping);
        };
    }, [socket]);

    // Stable callback — reads current values via refs, never goes stale
    const handleSelectRoom = useCallback(async (roomId) => {
        const prevRoomId = activeRoomIdRef.current;
        const currentSocket = socketRef.current;
        const currentToken = tokenRef.current;
        const currentMessages = messagesRef.current;

        if (prevRoomId === roomId) return;

        if (prevRoomId && currentSocket) {
            currentSocket.emit('leave_room', { roomId: prevRoomId });
        }

        setActiveRoomId(roomId);

        if (currentSocket) {
            currentSocket.emit('join_room', { roomId });
        }

        // Fetch history only if we don't have it yet
        if (!currentMessages[roomId]) {
            try {
                const res = await axios.get(`/api/rooms/${roomId}/messages`, {
                    headers: { Authorization: `Bearer ${currentToken}` }
                });
                const history = res.data.reverse();
                setMessages(prev => ({ ...prev, [roomId]: history }));
            } catch (err) {
                console.error('Failed to fetch messages', err);
            }
        }
    }, []); // no deps — always stable

    // Open room passed via navigation state (from Groups/Dashboard)
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
    }, [locationState, rooms]); // handleSelectRoom is stable (no deps), safe to omit

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

    const handleSendMessage = (content) => {
        if (!activeRoomId || !socket) return;
        socket.emit('send_message', { roomId: activeRoomId, content });
    };

    // Called from ChatCanvas > AddMemberModal when a contact is added to the room
    const handleRoomMemberAdded = useCallback((roomId, contact) => {
        setRooms(prev =>
            prev.map(r => {
                if (r.id !== roomId) return r;
                const newMember = { userId: contact.id, user: contact };
                const alreadyIn = r.members?.some(m => (m.user?.id ?? m.userId) === contact.id);
                if (alreadyIn) return r;
                return { ...r, members: [...(r.members ?? []), newMember] };
            })
        );
    }, []);

    // Called from AddContactModal once the DM room is returned from the server
    const handleStartDirectChat = useCallback((room, partnerUser) => {
        const enriched = enrichRoom(
            { ...room, dmPartnerName: partnerUser.username },
            user?.id
        );

        setRooms(prev => {
            const exists = prev.find(r => r.id === room.id);
            if (exists) {
                return prev.map(r => r.id === room.id ? enriched : r);
            }
            return [enriched, ...prev];
        });

        // Defer selection until after the setRooms state is committed
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
