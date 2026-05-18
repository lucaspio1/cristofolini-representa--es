import { Request, Response } from 'express';
import pool from '../database/db';

export const getProductLines = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product_lines ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product lines' });
  }
};

export const createProductLine = async (req: any, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  // Captura o nome da imagem gerado pelo multer (se houver)
  const imageName = req.file ? req.file.filename : null;

  try {
    const [result]: any = await pool.query(
      'INSERT INTO product_lines (name, image) VALUES (?, ?)',
      [name, imageName]
    );
    res.json({ id: result.insertId, name, image: imageName });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar linha de produto' });
  }
};

export const updateProductLine = async (req: any, res: Response) => {
  const { name } = req.body;
  const id = req.params.id;

  try {
    if (req.file) {
      // Se enviou uma imagem nova, atualiza o nome e a imagem
      await pool.query('UPDATE product_lines SET name = ?, image = ? WHERE id = ?', [name, req.file.filename, id]);
    } else {
      // Se não enviou imagem, atualiza só o nome
      await pool.query('UPDATE product_lines SET name = ? WHERE id = ?', [name, id]);
    }
    const [updated] = await pool.query('SELECT * FROM product_lines WHERE id = ?', [id]);
    res.json((updated as any)[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product line' });
  }
};

export const deleteProductLine = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM product_lines WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product line' });
  }
};