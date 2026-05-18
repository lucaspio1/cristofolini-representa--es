import { Request, Response } from 'express';
import pool from '../database/db';
import bcrypt from 'bcryptjs';

// Função para gerar uma senha aleatória de 8 caracteres
const generateTempPassword = () => Math.random().toString(36).slice(-8);

export const getUsers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, role, active, created_at FROM users ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, username, role } = req.body;
  try {
    const tempPassword = generateTempPassword(); // Gera senha padrão
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const [result]: any = await pool.query(
      'INSERT INTO users (name, username, password, role, active, must_change_password) VALUES (?, ?, ?, ?, true, true)',
      [name, username, hashedPassword, role || 'USER']
    );
    const [newUser] = await pool.query('SELECT id, name, username, role, active FROM users WHERE id = ?', [result.insertId]);
    
    // Retorna a senha provisória na resposta para o Administrador copiar!
    res.json({ user: (newUser as any)[0], tempPassword });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário (Verifique se o login já existe)' });
  }
};

export const toggleUserStatus = async (req: any, res: Response) => {
  const targetUserId = parseInt(req.params.id);
  const { active } = req.body;
  
  if (targetUserId === req.user.id && active === false) {
    return res.status(403).json({ error: 'Operação negada: Você não pode desativar o seu próprio usuário.' });
  }

  try {
    await pool.query('UPDATE users SET active = ? WHERE id = ?', [active, targetUserId]);
    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status do usuário' });
  }
};

// Nova Função: Reset de Senha pelo Admin
export const resetPassword = async (req: any, res: Response) => {
  const targetUserId = parseInt(req.params.id);
  try {
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE users SET password = ?, must_change_password = true WHERE id = ?', [hashedPassword, targetUserId]);
    res.json({ success: true, tempPassword });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
};

// Nova Função: O próprio usuário altera sua senha
export const changeMyPassword = async (req: any, res: Response) => {
  const { newPassword } = req.body;
  const userId = req.user.id;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, must_change_password = false WHERE id = ?', [hashedPassword, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar a senha' });
  }
};