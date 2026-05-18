import { Router } from 'express';
import { getUsers, createUser, toggleUserStatus, resetPassword, changeMyPassword } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Qualquer usuário logado pode alterar a própria senha
router.put('/change-my-password', authenticateToken, changeMyPassword);

// Restante das rotas (Apenas ADMIN)
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'ADMIN') next();
  else res.status(403).json({ error: 'Acesso negado: Apenas administradores.' });
};

router.get('/', authenticateToken, requireAdmin, getUsers);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id/toggle', authenticateToken, requireAdmin, toggleUserStatus);
router.put('/:id/reset-password', authenticateToken, requireAdmin, resetPassword);

export default router;