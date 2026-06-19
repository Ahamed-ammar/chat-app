import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();

    return (
        <nav className="bg-surface-container-lowest w-sidebar_width h-full flex flex-col items-center py-6 gap-8 border-r border-outline-variant z-20">
            <div className="font-display-lg text-display-lg text-primary">
                <span className="material-symbols-outlined text-4xl">cloud</span>
            </div>
            
            <div className="flex flex-col gap-6 items-center w-full flex-1">
                {/* Chats (Active) */}
                <button className="w-12 h-12 flex items-center justify-center text-primary bg-surface-container-high rounded-xl transition-transform hover:bg-surface-container">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </button>
                {/* Contacts */}
                <button className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded-xl">
                    <span className="material-symbols-outlined">group</span>
                </button>
                {/* Workspace */}
                <button className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded-xl">
                    <span className="material-symbols-outlined">view_quilt</span>
                </button>
            </div>

            <div className="mt-auto flex flex-col gap-6 items-center">
                <button 
                    onClick={logout}
                    className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors hover:bg-error-container/20 rounded-xl"
                    title="Logout">
                    <span className="material-symbols-outlined">logout</span>
                </button>
                <button className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container rounded-xl">
                    <span className="material-symbols-outlined">settings</span>
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-primary-container uppercase">
                    {user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
            </div>
        </nav>
    );
};

export default Sidebar;
