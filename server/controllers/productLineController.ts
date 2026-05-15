import { Request, Response } from 'express';
import db from '../database/db';

export const getProductLines = (req: Request, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM product_lines ORDER BY name ASC').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product lines' });
  }
};

export const createProductLine = (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const info = db.prepare('INSERT INTO product_lines (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid, name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save product line' });
  }
};

export const updateProductLine = (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    db.prepare('UPDATE product_lines SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ id: parseInt(req.params.id), name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product line' });
  }
};

export const deleteProductLine = (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM product_lines WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product line' });
  }
};