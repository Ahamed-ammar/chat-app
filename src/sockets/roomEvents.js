export default function registerRoomEvents(io, socket) {
    socket.on('join_room', (data) => {
        const { roomId } = data;
        socket.join(roomId);
        console.log(`User ${socket.user.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (data) => {
        const { roomId } = data;
        socket.leave(roomId);
        console.log(`User ${socket.user.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.id}`);
        // Cleanup if needed
    });
}
