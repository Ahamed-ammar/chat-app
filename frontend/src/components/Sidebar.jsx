import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { icon: 'chat_bubble', label: 'Chats',    path: '/',         fill: true  },
    { icon: 'group',       label: 'Groups',   path: '/groups',   fill: false },
    { icon: 'view_quilt',  label: 'Dashboard',path: '/dashboard',fill: false },
];

const Sidebar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isActive = (path) =>
        path === '/' ? pathname === '/' : pathname.startsWith(path);

    return (
        <nav className="bg-surface-container-lowest w-sidebar_width h-full flex flex-col items-center py-6 gap-8 border-r border-outline-variant z-20 flex-shrink-0">
            {/* Logo */}
            <div className="text-primary">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    chat_bubble
                </span>
            </div>

            {/* Primary nav */}
            <div className="flex flex-col gap-2 items-center w-full flex-1">
                {NAV.map(({ icon, label, path, fill }) => {
                    const active = isActive(path);
                    return (
                        <button
                            key={path}
                            title={label}
                            onClick={() => navigate(path)}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                                active
                                    ? 'text-primary bg-surface-container-high scale-95'
                                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                            }`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={active && fill ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {icon}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Bottom actions */}
            <div className="flex flex-col gap-2 items-center">
                <button
                    title="Settings"
                    onClick={() => navigate('/settings')}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                        isActive('/settings')
                            ? 'text-primary bg-surface-container-high'
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                    }`}
                >
                    <span
                        className="material-symbols-outlined"
                        style={isActive('/settings') ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                        settings
                    </span>
                </button>

                <button
                    title="Logout"
                    onClick={logout}
                    className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-xl transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                </button>

                {/* Avatar → profile */}
                <button
                    title="Profile"
                    onClick={() => navigate('/profile')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase transition-all ring-2 ${
                        isActive('/profile')
                            ? 'bg-primary text-white ring-primary'
                            : 'bg-primary-fixed text-primary ring-primary-fixed hover:ring-primary'
                    }`}
                >
                    {user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;
