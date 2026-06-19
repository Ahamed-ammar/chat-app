import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const ChatCanvas = ({ activeRoom, messages, onSendMessage, typingUsers }) => {
    const [newMessage, setNewMessage] = useState('');
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    if (!activeRoom) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest">
                <div className="text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">forum</span>
                    <h2 className="text-xl font-bold">Select a conversation</h2>
                    <p>Or create a new room to start chatting</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col relative bg-surface-container-lowest">
            {/* Chat Background Pattern */}
            <div className="absolute inset-0 chat-pattern pointer-events-none"></div>

            {/* TopAppBar */}
            <header className="h-16 w-full sticky top-0 z-10 bg-white/80 backdrop-blur-md flex justify-between items-center px-gutter border-b border-outline-variant">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold uppercase text-lg">
                            {activeRoom.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-tertiary border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h2 className="font-headline-md text-headline-md font-bold text-primary">{activeRoom.name}</h2>
                        <span className="text-label-xs font-label-xs text-tertiary">Online</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded-lg">
                        <span className="material-symbols-outlined">videocam</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded-lg">
                        <span className="material-symbols-outlined">call</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded-lg">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </header>

            {/* Chat Canvas Messages */}
            <div className="flex-1 overflow-y-auto p-gutter custom-scrollbar flex flex-col gap-6 z-0">
                <div className="flex justify-center my-4">
                    <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-xs text-label-xs">Beginning of Chat</span>
                </div>

                {messages.map((msg, index) => {
                    const isMe = msg.senderId === user.id;
                    return (
                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3`}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 mt-1 uppercase text-primary text-xs font-bold">
                                    {msg.sender?.username?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div className={`max-w-[70%] ${isMe ? 'bg-primary-container/20 rounded-tr-none' : 'bg-white border border-outline-variant rounded-tl-none'} p-4 rounded-2xl shadow-sm text-on-surface`}>
                                {!isMe && <p className="text-xs font-bold mb-1 text-primary">{msg.sender?.username || 'User'}</p>}
                                <p className="text-body-sm whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] opacity-70 mt-2 block ${isMe ? 'text-right' : 'text-outline'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                
                {typingUsers && Object.keys(typingUsers).length > 0 && (
                    <div className="flex justify-start gap-3 opacity-50">
                        <div className="p-4 rounded-2xl shadow-sm bg-surface-container-low text-body-sm italic">
                            Someone is typing...
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <footer className="p-gutter bg-white/80 backdrop-blur-md border-t border-outline-variant relative z-10">
                <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/20 focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container transition-all">
                    <button type="button" className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">attachment</span>
                    </button>
                    <button type="button" className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">mood</span>
                    </button>
                    <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-body-sm py-2 outline-none" 
                        placeholder="Type a message..." 
                        type="text" 
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50">
                        <span className="material-symbols-outlined -rotate-45 ml-1">send</span>
                    </button>
                </form>
            </footer>
        </main>
    );
};

export default ChatCanvas;
