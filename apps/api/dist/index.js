"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const home_route_1 = __importDefault(require("./routes/home.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const faq_route_1 = __importDefault(require("./routes/faq.route"));
const testimonial_route_1 = __importDefault(require("./routes/testimonial.route"));
const dashboard_route_1 = __importDefault(require("./routes/dashboard.route"));
const news_route_1 = __importDefault(require("./routes/news.route"));
const commissariat_route_1 = __importDefault(require("./routes/commissariat.route"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true,
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'GenBI Express API is live.' });
});
// Feature Routes
app.use('/api/home', home_route_1.default);
app.use('/api/auth', auth_route_1.default);
app.use('/api/faqs', faq_route_1.default);
app.use('/api/testimonials', testimonial_route_1.default);
app.use('/api/dashboard', dashboard_route_1.default);
app.use('/api/news', news_route_1.default);
app.use('/api/commissariats', commissariat_route_1.default);
app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
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
