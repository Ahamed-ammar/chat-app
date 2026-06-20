import * as chatService from '../services/chatService.js';

export const createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Room name is required" });
        }
        const room = await chatService.createRoom(name);
        res.status(201).json(room);
    } catch (error) {
        console.error("createRoom error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getOrCreateDirectRoom = async (req, res) => {
    try {
        const userIdA = req.user.id;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ message: "targetUserId is required" });
        }
        if (targetUserId === userIdA) {
            return res.status(400).json({ message: "Cannot create a direct room with yourself" });
        }

        const room = await chatService.getOrCreateDirectRoom(userIdA, targetUserId);
        res.status(200).json(room);
    } catch (error) {
        console.error("getOrCreateDirectRoom error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getRooms = async (req, res) => {
    try {
        const userId = req.user.id;
        const rooms = await chatService.getRooms(userId);
        res.status(200).json(rooms);
    } catch (error) {
        console.error("getRooms error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const joinRoom = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const userId = req.user.id;
        
        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required" });
        }

        const member = await chatService.joinRoom(userId, roomId);
        res.status(200).json(member);
    } catch (error) {
        console.error("joinRoom error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
