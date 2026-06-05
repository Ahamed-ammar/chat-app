import { authService } from "../services/authService.js";

export const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const { user, token } = await authService.register(email, password, username);

        res.status(201).json({
            user,
            token
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token } = await authService.login(email, password);

        res.status(200).json({
            token
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};