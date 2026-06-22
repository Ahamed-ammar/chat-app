import prisma from '../config/prismaConfig.js';

export const createRoom = async (name, creatorId) => {
    return await prisma.chatRoom.create({
        data: {
            name,
            members: creatorId
                ? { create: [{ userId: creatorId }] }
                : undefined
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
};

export const getRooms = async (userId) => {
    return await prisma.chatRoom.findMany({
        where: {
            members: { some: { userId } }
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
        where: { userId_roomId: { userId, roomId } }
    });
    if (existingMember) return existingMember;

    return await prisma.roomMember.create({
        data: { userId, roomId }
    });
};

export const sendMessage = async (userId, roomId, content) => {
    return await prisma.message.create({
        data: { senderId: userId, roomId, content },
        include: {
            sender: { select: { id: true, username: true } }
        }
    });
};

export const getOrCreateDirectRoom = async (userIdA, userIdB) => {
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

    if (existing && existing.members.length === 2) return existing;

    return await prisma.chatRoom.create({
        data: {
            name: `dm_${userIdA}_${userIdB}`,
            isDirect: true,
            members: {
                create: [{ userId: userIdA }, { userId: userIdB }]
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
};

export const getContacts = async (userId) => {
    // A contact is anyone you've had a DM room with
    const directRooms = await prisma.chatRoom.findMany({
        where: {
            isDirect: true,
            members: { some: { userId } }
        },
        include: {
            members: {
                include: { user: { select: { id: true, username: true, email: true } } }
            }
        }
    });

    const contacts = [];
    const seen = new Set();
    for (const room of directRooms) {
        const partner = room.members.find(m => m.user.id !== userId);
        if (partner && !seen.has(partner.user.id)) {
            seen.add(partner.user.id);
            contacts.push(partner.user);
        }
    }
    return contacts;
};

export const addMemberToRoom = async (roomId, requesterId, targetUserId) => {
    const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { members: true }
    });

    if (!room) throw new Error('Room not found');
    if (room.isDirect) throw new Error('Cannot add members to a direct message room');

    const isMember = room.members.some(m => m.userId === requesterId);
    if (!isMember) throw new Error('You are not a member of this room');

    const alreadyIn = room.members.some(m => m.userId === targetUserId);
    if (alreadyIn) throw new Error('User is already in this room');

    // Only contacts (shared DM) can be added
    const sharedDm = await prisma.chatRoom.findFirst({
        where: {
            isDirect: true,
            AND: [
                { members: { some: { userId: requesterId } } },
                { members: { some: { userId: targetUserId } } },
            ]
        }
    });
    if (!sharedDm) throw new Error('You can only add users from your contacts');

    return await prisma.roomMember.create({
        data: { userId: targetUserId, roomId },
        include: { user: { select: { id: true, username: true } } }
    });
};

export const getMessages = async (roomId, cursor, limit = 20) => {
    const args = {
        where: { roomId },
        take: parseInt(limit, 10) || 20,
        orderBy: { createdAt: 'desc' },
        include: {
            sender: { select: { id: true, username: true } }
        }
    };

    if (cursor) {
        args.cursor = { id: cursor };
        args.skip = 1;
    }

    return await prisma.message.findMany(args);
};
