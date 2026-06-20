import prisma from '../config/prismaConfig.js';

export const createRoom = async (name) => {
    return await prisma.chatRoom.create({
        data: { name }
    });
};

export const getRooms = async (userId) => {
    return await prisma.chatRoom.findMany({
        where: {
            members: {
                some: { userId }
            }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            members: {
                include: {
                    user: { select: { id: true, username: true } }
                }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    sender: { select: { id: true, username: true } }
                }
            }
        }
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

export const getOrCreateDirectRoom = async (userIdA, userIdB) => {
    // Look for an existing DM room between exactly these two users
    const existing = await prisma.chatRoom.findFirst({
        where: {
            isDirect: true,
            AND: [
                { members: { some: { userId: userIdA } } },
                { members: { some: { userId: userIdB } } },
            ]
        },
        include: {
            members: {
                include: { user: { select: { id: true, username: true } } }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { sender: { select: { id: true, username: true } } }
            }
        }
    });

    // Strictly validate it's a 2-member room (not a group that happens to include both)
    if (existing && existing.members.length === 2) {
        return existing;
    }

    const room = await prisma.chatRoom.create({
        data: {
            name: `dm_${userIdA}_${userIdB}`,
            isDirect: true,
            members: {
                create: [
                    { userId: userIdA },
                    { userId: userIdB }
                ]
            }
        },
        include: {
            members: {
                include: { user: { select: { id: true, username: true } } }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { sender: { select: { id: true, username: true } } }
            }
        }
    });

    return room;
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
