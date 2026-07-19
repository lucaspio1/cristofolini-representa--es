import express from 'express';
import pool from '../database/db';

const router = express.Router();

// GET: Buscar todas as metas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM goals ORDER BY year DESC, month ASC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ error: 'Erro interno ao buscar metas' });
  }
});

// POST: Criar ou Atualizar uma meta (Upsert)
router.post('/', async (req, res) => {
  const { year, month, goal_tons, goal_revenue } = req.body;
  
  try {
    // Utiliza o ON DUPLICATE KEY UPDATE graças ao UNIQUE KEY que criamos no db.ts
    // Se a meta já existir para aquele mês/ano, ele apenas atualiza os valores.
    const [result] = await pool.query(`
      INSERT INTO goals (year, month, goal_tons, goal_revenue) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      goal_tons = VALUES(goal_tons), 
      goal_revenue = VALUES(goal_revenue)
    `, [year, month, goal_tons, goal_revenue]);
    
    res.status(200).json({ message: 'Meta guardada com sucesso!', success: true });
  } catch (error) {
    console.error('Erro ao guardar meta:', error);
    res.status(500).json({ error: 'Erro interno ao guardar a meta' });
  }
});

export default router;