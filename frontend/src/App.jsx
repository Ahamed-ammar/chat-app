import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return null;
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const ProtectedSocket = ({ children }) => (
    <ProtectedRoute>
        <SocketProvider>{children}</SocketProvider>
    </ProtectedRoute>
);

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedSocket><Chat /></ProtectedSocket>
            } />
            <Route path="/groups" element={
                <ProtectedRoute><Groups /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
