import express, { urlencoded } from 'express';
import logger from '#config/logger.js';
import authRoutes from './routes/auth.route.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: { write: (message) => logger.http(message.trim()) } }));
app.get('/', (req, res) => {
  logger.info('Hello from acquisitions');
  res.status(200).send('Hello from acquisitions');
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), upTime: process.uptime() });
});
app.get('/api', (req, res) => {
  res.status(200).send('Acquisition api is running');
});
app.use('/api/auth', authRoutes);

export default app;
