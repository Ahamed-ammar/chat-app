import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${checked ? 'bg-secondary-container' : 'bg-surface-container-highest'}`}>
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${checked ? 'translate-x-5 bg-white' : 'bg-outline'}`} />
        </div>
    </label>
);

const SettingRow = ({ icon, title, desc, action, first, last }) => (
    <div className={`flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors ${first ? 'rounded-t-[1.25rem]' : ''} ${last ? 'rounded-b-[1.25rem]' : ''}`}>
        <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
                <p className="font-bold text-on-surface">{title}</p>
                <p className="text-sm text-on-surface-variant">{desc}</p>
            </div>
        </div>
        {action}
    </div>
);

const Settings = () => {
    const { logout, user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [msgPreview, setMsgPreview] = useState(true);
    const [soundAlerts, setSoundAlerts] = useState(false);
    const [fontSize, setFontSize] = useState('Standard');

    const handleDarkMode = () => {
        setDarkMode(v => {
            document.documentElement.classList.toggle('dark', !v);
            return !v;
        });
    };

    return (
        <div className="canvas-bg">
            <div className="app-shell shadow-2xl">
                <Sidebar />

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Top bar */}
                    <header className="h-16 px-gutter flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
                            <h1 className="text-xl font-bold text-on-surface tracking-tight">Settings</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm uppercase">
                                {user?.username?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-on-surface leading-tight">{user?.username}</p>
                                <p className="text-xs text-on-surface-variant">{user?.email}</p>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

                            {/* Appearance */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-secondary px-1">
                                    <span className="material-symbols-outlined">palette</span>
                                    <h2 className="text-base font-bold tracking-tight">Theme &amp; Appearance</h2>
                                </div>
                                <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] divide-y divide-outline-variant/10">
                                    <SettingRow
                                        first icon="dark_mode" title="Dark Mode"
                                        desc="Switch between light and dark interface"
                                        action={<Toggle checked={darkMode} onChange={handleDarkMode} />}
                                    />
                                    <SettingRow
                                        last icon="format_size" title="Font Size"
                                        desc="Adjust the global text scaling"
                                        action={
                                            <select
                                                value={fontSize}
                                                onChange={e => setFontSize(e.target.value)}
                                                className="bg-surface-container-low border border-outline-variant/30 rounded-xl font-medium text-sm px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                                            >
                                                <option>Compact</option>
                                                <option>Standard</option>
                                                <option>Comfortable</option>
                                            </select>
                                        }
                                    />
                                </div>
                            </section>

                            {/* Notifications */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-secondary px-1">
                                    <span className="material-symbols-outlined">notifications_active</span>
                                    <h2 className="text-base font-bold tracking-tight">Notifications</h2>
                                </div>
                                <div className="bg-white border border-outline-variant/30 rounded-[1.25rem] divide-y divide-outline-variant/10">
                                    <SettingRow
                                        first icon="chat_bubble" title="Message Previews"
                                        desc="Show message content in banners"
                                        action={<Toggle checked={msgPreview} onChange={() => setMsgPreview(v => !v)} />}
                                    />
                                    <SettingRow
                                        last icon="volume_up" title="Sound Alerts"
                                        desc="Play sounds for incoming messages"
                                        action={<Toggle checked={soundAlerts} onChange={() => setSoundAlerts(v => !v)} />}
                                    />
                                </div>
                            </section>

                            {/* Privacy */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-secondary px-1">
                                    <span className="material-symbols-outlined">security</span>
                                    <h2 className="text-base font-bold tracking-tight">Privacy &amp; Security</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: 'lock',           color: 'primary',   title: 'Two-Factor Auth',  desc: 'Add an extra layer of security to your account.', label: 'Manage Security'  },
                                        { icon: 'visibility_off', color: 'secondary', title: 'Privacy Profile',  desc: 'Control who can see your activity and profile.',  label: 'Manage Privacy'   },
                                    ].map(({ icon, color, title, desc, label }) => (
                                        <div key={title} className={`bg-white border border-outline-variant/30 rounded-[1.25rem] p-6 flex flex-col gap-4 hover:border-${color}/30 transition-all cursor-pointer group`}>
                                            <div className={`w-12 h-12 rounded-full bg-${color}/5 flex items-center justify-center text-${color} group-hover:bg-${color} group-hover:text-white transition-all`}>
                                                <span className="material-symbols-outlined">{icon}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-on-surface mb-1">{title}</h3>
                                                <p className="text-sm text-on-surface-variant">{desc}</p>
                                            </div>
                                            <span className={`mt-auto text-${color} text-sm font-bold flex items-center gap-1`}>
                                                {label} <span className="material-symbols-outlined text-base">chevron_right</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Account */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-error px-1">
                                    <span className="material-symbols-outlined">manage_accounts</span>
                                    <h2 className="text-base font-bold tracking-tight">Account Management</h2>
                                </div>
                                <div className="bg-error-container/5 border border-error/10 rounded-[1.25rem] divide-y divide-error/10">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center justify-between p-6 hover:bg-error-container/10 transition-colors text-left rounded-t-[1.25rem]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-error">logout</span>
                                            <div>
                                                <p className="font-bold text-on-surface">Logout</p>
                                                <p className="text-sm text-on-surface-variant">Sign out of your account on this device</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
                                    </button>
                                    <button className="w-full flex items-center justify-between p-6 hover:bg-error-container/20 transition-colors text-left rounded-b-[1.25rem]">
                                        <div className="flex items-center gap-4">
                                            <span className="material-symbols-outlined text-error">no_accounts</span>
                                            <div>
                                                <p className="font-bold text-error">Deactivate Account</p>
                                                <p className="text-sm text-on-surface-variant">Temporarily disable or permanently delete account</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
                                    </button>
                                </div>
                            </section>

                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Settings;
