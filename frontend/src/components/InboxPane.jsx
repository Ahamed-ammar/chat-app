import React, { useState } from 'react';

const InboxPane = ({ rooms, activeRoomId, onSelectRoom, onCreateRoom }) => {
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
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="bg-secondary-container text-on-primary-container p-2 rounded-lg hover:opacity-90 transition-opacity">
                        <span className="material-symbols-outlined text-[20px]">{isCreating ? 'close' : 'edit_square'}</span>
                    </button>
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
                {rooms.map(room => (
                    <div 
                        key={room.id}
                        onClick={() => onSelectRoom(room.id)}
                        className={`flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-colors ${
                            activeRoomId === room.id 
                                ? 'bg-surface-container-low border-primary' 
                                : 'hover:bg-surface-container border-transparent'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-primary-fixed flex items-center justify-center text-primary font-bold text-lg uppercase">
                            {room.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-label-md text-label-md truncate text-on-surface">{room.name}</h3>
                            </div>
                            <p className="text-body-sm truncate text-on-surface-variant">Click to join chat...</p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default InboxPane;
