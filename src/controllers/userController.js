import prisma from '../config/prismaConfig.js';
import * as chatService from '../services/chatService.js';

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.trim().length < 1) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    {
                        OR: [
                            { username: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } },
                        ]
                    }
                ]
            },
            select: { id: true, username: true, email: true },
            take: 10,
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('searchUsers error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getContacts = async (req, res) => {
    try {
        const contacts = await chatService.getContacts(req.user.id);
        res.status(200).json(contacts);
    } catch (error) {
        console.error('getContacts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
