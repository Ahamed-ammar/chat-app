import * as chatService from '../services/chatService.js';

export const sendMessage = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!roomId || !content) {
            return res.status(400).json({ message: "Room ID and content are required" });
        }

        const message = await chatService.sendMessage(userId, roomId, content);
        res.status(201).json(message);
    } catch (error) {
        console.error("sendMessage error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const { cursor, limit } = req.query;

        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required" });
        }

        const messages = await chatService.getMessages(roomId, cursor, limit);
        res.status(200).json(messages);
    } catch (error) {
        console.error("getMessages error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
