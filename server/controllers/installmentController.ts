import { Request, Response } from 'express';
import pool from '../database/db';

export const getAllInstallments = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, s.cliente, s.numero_nf, s.comissao_percentage 
      FROM installments i 
      JOIN sales s ON i.sale_id = s.id 
      ORDER BY i.due_date ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all installments' });
  }
};

export const updateInstallment = async (req: Request, res: Response) => {
  const { payment_date } = req.body;
  try {
    await pool.query('UPDATE installments SET payment_date = ? WHERE id = ?', [payment_date || null, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update installment' });
  }
};