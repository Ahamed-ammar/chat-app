import React, { useState } from 'react';

const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const InboxPane = ({ rooms, activeRoomId, onSelectRoom, onCreateRoom, onAddContact }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (newRoomName.trim()) {
            onCreateRoom(newRoomName.trim());
            setNewRoomName('');
            setIsCreating(false);
        }
    };

    return (
        <aside className="w-list_width h-full bg-white flex flex-col border-r border-outline-variant z-10">
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                        Inbox <span className="text-primary font-normal">({rooms.length})</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Add Contact */}
                        <button
                            onClick={onAddContact}
                            title="Add Contact"
                            className="bg-secondary-container text-on-primary-container p-2 rounded-lg hover:opacity-90 transition-opacity">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                        </button>
                        {/* New Room */}
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            title="New Room"
                            className="bg-surface-container text-on-surface-variant p-2 rounded-lg hover:opacity-90 transition-opacity">
                            <span className="material-symbols-outlined text-[20px]">{isCreating ? 'close' : 'edit_square'}</span>
                        </button>
                    </div>
                </div>

                {isCreating ? (
                    <form onSubmit={handleCreate} className="mb-4 flex gap-2">
                        <input
                            autoFocus
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="flex-1 bg-surface-container-low border-none rounded-lg py-2 px-3 text-body-sm focus:ring-2 focus:ring-primary-container"
                            placeholder="Room name..."
                        />
                        <button type="submit" className="bg-primary text-white px-3 rounded-lg text-sm font-bold">
                            Add
                        </button>
                    </form>
                ) : (
                    <div className="relative group mb-4">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] group-focus-within:text-primary transition-colors">search</span>
                        <input
                            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-body-sm focus:ring-2 focus:ring-primary-container transition-shadow"
                            placeholder="Find a conversation"
                            type="text"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {rooms.map(room => {
                    const displayName = room.isDirect && room.dmPartnerName
                        ? room.dmPartnerName
                        : room.name;
                    const lastMsg = room.lastMessage;
                    const previewText = lastMsg
                        ? lastMsg.content
                        : room.isDirect ? 'Start a conversation' : 'Click to join chat...';
                    const timeStr = formatTime(room.lastMessageAt);

                    return (
                        <div
                            key={room.id}
                            onClick={() => onSelectRoom(room.id)}
                            className={`flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-colors ${
                                activeRoomId === room.id
                                    ? 'bg-surface-container-low border-primary'
                                    : 'hover:bg-surface-container border-transparent'
                            }`}
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-lg uppercase">
                                    {displayName.charAt(0)}
                                </div>
                                {room.isDirect && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-tertiary border-2 border-white rounded-full" />
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate text-on-surface">{displayName}</h3>
                                        {room.isDirect && (
                                            <span className="material-symbols-outlined text-[13px] text-tertiary flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                        )}
                                    </div>
                                    {timeStr && (
                                        <span className="text-[11px] text-on-surface-variant flex-shrink-0">{timeStr}</span>
                                    )}
                                </div>
                                <p className="text-xs truncate text-on-surface-variant mt-0.5">{previewText}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default InboxPane;
