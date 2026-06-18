import prisma from '../config/prismaConfig.js';

export const createRoom = async (name) => {
    return await prisma.chatRoom.create({
        data: { name }
    });
};

export const getRooms = async () => {
    return await prisma.chatRoom.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

export const joinRoom = async (userId, roomId) => {
    const existingMember = await prisma.roomMember.findUnique({
        where: {
            userId_roomId: {
                userId,
                roomId
            }
        }
    });

    if (existingMember) {
        return existingMember;
    }

    return await prisma.roomMember.create({
        data: {
            userId,
            roomId
        }
    });
};

export const sendMessage = async (userId, roomId, content) => {
    return await prisma.message.create({
        data: {
            senderId: userId,
            roomId,
            content
        },
        include: {
            sender: {
                select: { id: true, username: true }
            }
        }
    });
};

export const getMessages = async (roomId, cursor, limit = 20) => {
    const args = {
        where: { roomId },
        take: parseInt(limit, 10) || 20,
        orderBy: { createdAt: 'desc' },
        include: {
            sender: {
                select: { id: true, username: true }
            }
        }
    };

    if (cursor) {
        args.cursor = { id: cursor };
        args.skip = 1; // Skip the cursor itself
    }

    const messages = await prisma.message.findMany(args);
    return messages;
};
