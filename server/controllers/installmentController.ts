import { Request, Response } from 'express';
import db from '../database/db';

export const getAllInstallments = (req: Request, res: Response) => {
  try {
    const installments = db.prepare(`
      SELECT i.*, s.cliente, s.numero_nf, s.comissao_percentage 
      FROM installments i 
      JOIN sales s ON i.sale_id = s.id 
      ORDER BY i.due_date ASC
    `).all();
    res.json(installments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all installments' });
  }
};

export const updateInstallment = (req: Request, res: Response) => {
  const { payment_date } = req.body;
  try {
    db.prepare('UPDATE installments SET payment_date = ? WHERE id = ?').run(payment_date || null, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update installment' });
  }
};