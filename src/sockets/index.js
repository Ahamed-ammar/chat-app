import { initializeSocket } from '../config/socket.js';
import registerChatEvents from './chatEvents.js';
import registerRoomEvents from './roomEvents.js';

export const setupSockets = (server) => {
    const io = initializeSocket(server);

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id}`);

        // Register event handlers
        registerChatEvents(io, socket);
        registerRoomEvents(io, socket);
    });
};
