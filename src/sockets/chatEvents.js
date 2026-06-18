import * as chatService from '../services/chatService.js';

export default function registerChatEvents(io, socket) {
    socket.on('send_message', async (data) => {
        try {
            const { roomId, content } = data;
            const userId = socket.user.id;
            
            // Save to DB
            const message = await chatService.sendMessage(userId, roomId, content);
            
            // Emit to room
            io.to(roomId).emit('new_message', message);
        } catch (error) {
            console.error('Error sending message via socket:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('typing', (data) => {
        const { roomId } = data;
        // Emit to everyone in the room except the sender
        socket.to(roomId).emit('user_typing', { userId: socket.user.id });
    });
}
