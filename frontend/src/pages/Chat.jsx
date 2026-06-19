import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import InboxPane from '../components/InboxPane';
import ChatCanvas from '../components/ChatCanvas';

const Chat = () => {
    const { token } = useAuth();
    const { socket } = useSocket();
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [messages, setMessages] = useState({}); // { roomId: [messages] }
    const [typingUsers, setTypingUsers] = useState({}); // { roomId: { userId: timestamp } }

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    const activeMessages = activeRoomId ? (messages[activeRoomId] || []) : [];

    // Fetch rooms on load
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await axios.get('/api/rooms', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRooms(res.data);
            } catch (err) {
                console.error("Failed to fetch rooms", err);
            }
        };
        fetchRooms();
    }, [token]);

    // Setup Socket.IO listeners
    useEffect(() => {
        if (!socket) return;

        const onNewMessage = (msg) => {
            setMessages(prev => {
                const roomMsgs = prev[msg.roomId] || [];
                // Check if message already exists
                if (roomMsgs.find(m => m.id === msg.id)) return prev;
                return {
                    ...prev,
                    [msg.roomId]: [...roomMsgs, msg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                };
            });
        };

        const onUserTyping = ({ userId }) => {
            // we could track this per room, for simplicity we just track it globally or per active room
            setTypingUsers(prev => ({
                ...prev,
                [activeRoomId]: { ...(prev[activeRoomId] || {}), [userId]: Date.now() }
            }));
            
            // clear typing after 3 seconds
            setTimeout(() => {
                setTypingUsers(prev => {
                    const newTyping = { ...prev };
                    if (newTyping[activeRoomId] && newTyping[activeRoomId][userId]) {
                        delete newTyping[activeRoomId][userId];
                    }
                    return newTyping;
                });
            }, 3000);
        };

        socket.on('new_message', onNewMessage);
        socket.on('user_typing', onUserTyping);

        return () => {
            socket.off('new_message', onNewMessage);
            socket.off('user_typing', onUserTyping);
        };
    }, [socket, activeRoomId]);

    // Fetch messages when joining a room
    const handleSelectRoom = async (roomId) => {
        if (activeRoomId === roomId) return;
        
        if (activeRoomId && socket) {
            socket.emit('leave_room', { roomId: activeRoomId });
        }
        
        setActiveRoomId(roomId);
        
        if (socket) {
            socket.emit('join_room', { roomId });
        }

        // Fetch history if we don't have it
        if (!messages[roomId]) {
            try {
                const res = await axios.get(`/api/rooms/${roomId}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // the api returns desc order, so reverse to display correctly
                const history = res.data.reverse();
                setMessages(prev => ({
                    ...prev,
                    [roomId]: history
                }));
            } catch (err) {
                console.error("Failed to fetch messages", err);
            }
        }
    };

    const handleCreateRoom = async (name) => {
        try {
            const res = await axios.post('/api/rooms', { name }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newRoom = res.data;
            setRooms(prev => [newRoom, ...prev]);
            handleSelectRoom(newRoom.id);
        } catch (err) {
            console.error("Failed to create room", err);
        }
    };

    const handleSendMessage = (content) => {
        if (!activeRoomId || !socket) return;
        
        // Let the server save to DB and broadcast via socket
        socket.emit('send_message', { roomId: activeRoomId, content });
    };

    return (
        <div className="canvas-bg">
            <div className="app-shell shadow-2xl relative">
                <Sidebar />
                <InboxPane 
                    rooms={rooms} 
                    activeRoomId={activeRoomId} 
                    onSelectRoom={handleSelectRoom}
                    onCreateRoom={handleCreateRoom}
                />
                <ChatCanvas 
                    activeRoom={activeRoom}
                    messages={activeMessages}
                    onSendMessage={handleSendMessage}
                    typingUsers={typingUsers[activeRoomId]}
                />
            </div>
        </div>
    );
};

export default Chat;
