import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

/**
 * STOMP over SockJS — replaces Socket.IO.
 *
 * Spring WebSocket endpoint:  /ws  (with SockJS fallback)
 * App destination prefix:     /app/...
 * Topic prefix:               /topic/...
 *
 * The context exposes:
 *   stompClient  — the raw @stomp/stompjs Client (use to publish and subscribe)
 *   connected    — boolean, true once STOMP CONNECT ack received
 */

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { token } = useAuth();
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!token) {
            // If no token, disconnect any existing client
            if (clientRef.current?.active) {
                clientRef.current.deactivate();
                clientRef.current = null;
                setConnected(false);
            }
            return;
        }

        const client = new Client({
            // SockJS factory — connects to Spring's /ws endpoint
            webSocketFactory: () => new SockJS('/ws'),

            // JWT passed in STOMP CONNECT headers
            // Spring's WebSocketAuthInterceptor reads "Authorization: Bearer <token>"
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },

            reconnectDelay: 5000, // auto-reconnect after 5s on disconnect

            onConnect: () => {
                setConnected(true);
                console.log('[STOMP] Connected');
            },

            onDisconnect: () => {
                setConnected(false);
                console.log('[STOMP] Disconnected');
            },

            onStompError: (frame) => {
                console.error('[STOMP] Error:', frame.headers?.message);
                setConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ stompClient: clientRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
