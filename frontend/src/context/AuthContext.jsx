import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Usually we'd fetch the user profile from an /api/auth/me endpoint.
            // Since we don't have one explicitly built in the previous steps, we rely on the token.
            // But we can decode the JWT to get user details for now (if we want) or just set a generic user state.
            // In a real app, verify the token.
            try {
                // simple base64 decode of jwt payload for basic info
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.id, email: payload.email, username: payload.username });
            } catch (e) {
                console.error("Invalid token", e);
                logout();
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const response = await axios.post('/api/auth/login', { email, password });
        const { token } = response.data;
        localStorage.setItem('auth_token', token);
        setToken(token);
    };

    const register = async (email, username, password) => {
        const response = await axios.post('/api/auth/register', { email, username, password });
        const { token } = response.data;
        localStorage.setItem('auth_token', token);
        setToken(token);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
