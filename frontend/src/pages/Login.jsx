import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, username, password);
            }
            navigate('/');
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Authentication failed';
            alert(`Authentication failed: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-background text-on-surface">
            <main className="w-full max-w-[480px] space-y-8">
                {/* Header Branding */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary-container mb-4">
                        <span className="material-symbols-outlined text-on-secondary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                    </div>
                    <h1 className="text-3xl font-bold text-on-surface tracking-tight">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </h1>
                    <p className="text-on-surface-variant mt-2">
                        {isLogin ? 'Welcome back to ChatFlow' : 'Join thousands of professional teams'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="app-card p-8 sm:p-10">
                    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                        {/* Google Sign In (Mock) */}
                        <button className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white border border-outline-variant rounded-xl font-semibold text-on-surface hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98]" type="button">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            Continue with Google
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-outline-variant/50"></div>
                            <span className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">or email</span>
                            <div className="h-px flex-1 bg-outline-variant/50"></div>
                        </div>

                        {/* Fields Container */}
                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-on-surface-variant">Username</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl input-focus-cyan focus:ring-2 outline-none transition-all placeholder:text-outline-variant"
                                        placeholder="johndoe" 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-on-surface-variant">Email</label>
                                <input 
                                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl input-focus-cyan focus:ring-2 outline-none transition-all placeholder:text-outline-variant"
                                    placeholder="name@company.com" 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-on-surface-variant">Password</label>
                                    {isLogin && <a className="text-xs font-semibold text-secondary-container hover:text-secondary transition-colors" href="#">Forgot?</a>}
                                </div>
                                <div className="relative group">
                                    <input 
                                        className="w-full pl-4 pr-12 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl input-focus-cyan focus:ring-2 outline-none transition-all placeholder:text-outline-variant"
                                        placeholder="••••••••" 
                                        type={showPassword ? 'text' : 'password'}
                                        required 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                                        onClick={() => setShowPassword(!showPassword)} 
                                        type="button">
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit CTA */}
                        <button 
                            disabled={isSubmitting}
                            className="w-full bg-secondary-container text-on-secondary-container font-bold py-3.5 rounded-xl hover:opacity-90 shadow-sm transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                            type="submit">
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-on-secondary-container" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Get Started'}
                                    <span className="material-symbols-outlined text-xl">{isLogin ? 'arrow_forward' : 'rocket_launch'}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-on-surface-variant font-medium">
                    <span>{isLogin ? 'New to ChatFlow?' : 'Already have an account?'}</span>
                    <button className="text-secondary-container font-bold hover:underline underline-offset-4 ml-1" onClick={toggleAuthMode}>
                        {isLogin ? 'Create an account' : 'Sign In'}
                    </button>
                </p>
            </main>
        </div>
    );
};

export default Login;
