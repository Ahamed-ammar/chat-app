import express from "express"
import cors from "cors"
import helmet from "helmet"
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import { authenticate } from "./middleware/authMiddleware.js";
import http from 'http';
import { setupSockets } from './sockets/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ message: "health is good!!!" });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', authenticate, roomRoutes);

const server = http.createServer(app);
setupSockets(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});