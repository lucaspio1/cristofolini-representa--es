import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Importando middlewares e banco de dados
import db from './server/database/db';
import { authenticateToken } from './server/middlewares/auth';
import { upload, uploadsDir } from './server/middlewares/upload';

// Importando Rotas
import clientRoutes from './server/routes/clientRoutes';
import productLineRoutes from './server/routes/productLineRoutes';
import salesRoutes from './server/routes/salesRoutes';
import installmentRoutes from './server/routes/installmentRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'cristofolini-secret-key-2026';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Servir pasta de uploads de forma estática
  app.use('/uploads', express.static(uploadsDir));

  // --- Rotas de Autenticação ---
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) return res.status(401).json({ error: 'Senha incorreta' });

      const token = jwt.sign({ id: user.id, username: user.username, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, username: user.username, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  });

  app.get('/api/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // --- Rota de Upload ---
  // Nota: Em breve vamos proteger isso!
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // --- Registrando as Rotas Desmembradas ---
  // Nota: Na etapa final, vamos colocar o 'authenticateToken' em todas essas linhas!
  app.use('/api/clients', clientRoutes);
  app.use('/api/product-lines', productLineRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/installments', installmentRoutes);
  
  // As rotas legadas de client-products foram injetadas no clientRoutes
  app.use('/api', clientRoutes); 

  // --- Configuração do Vite (Frontend) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();