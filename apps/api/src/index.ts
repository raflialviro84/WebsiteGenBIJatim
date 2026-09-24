import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import homeRoutes from './routes/home.route';
import authRoutes from './routes/auth.route';
import faqRoutes from './routes/faq.route';
import testimonialRoutes from './routes/testimonial.route';
import dashboardRoutes from './routes/dashboard.route';
import newsRoutes from './routes/news.route';
import commissariatRoutes from './routes/commissariat.route';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'GenBI Express API is live.' });
});

// Feature Routes
app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/commissariats', commissariatRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Ukuran foto terlalu besar. Maksimal 20MB untuk cover berita.' });
    }
    return res.status(400).json({ message: err.message || 'Upload file gagal.' });
  }

  if (err) {
    return res.status(400).json({ message: err.message || 'Permintaan tidak valid.' });
  }

  next();
});

// Server Init
app.listen(PORT, () => {
  console.log(`[server]: API running effortlessly at http://localhost:${PORT}`);
});
