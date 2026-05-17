import { Request, Response } from 'express';
import pool from '../database/db';

export const getClients = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  const { name, cnpj, endereco, responsavel, telefone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const [result]: any = await pool.query(
      'INSERT INTO clients (name, cnpj, endereco, responsavel, telefone, email) VALUES (?, ?, ?, ?, ?, ?)',
      [name, cnpj, endereco, responsavel, telefone, email]
    );
    const [newClient] = await pool.query('SELECT * FROM clients WHERE id = ?', [result.insertId]);
    res.json((newClient as any)[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  const { name, cnpj, endereco, responsavel, telefone, email } = req.body;
  try {
    await pool.query(
      'UPDATE clients SET name = ?, cnpj = ?, endereco = ?, responsavel = ?, telefone = ?, email = ? WHERE id = ?',
      [name, cnpj, endereco, responsavel, telefone, email, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json((updated as any)[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
};

export const getClientProducts = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM client_products WHERE client_id = ?', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createClientProduct = async (req: Request, res: Response) => {
  const { product_name, image_url } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO client_products (client_id, product_name, image_url) VALUES (?, ?, ?)',
      [req.params.id, product_name, image_url]
    );
    const [newProduct] = await pool.query('SELECT * FROM client_products WHERE id = ?', [result.insertId]);
    res.json((newProduct as any)[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
};

export const updateClientProduct = async (req: Request, res: Response) => {
  const { product_name, image_url } = req.body;
  try {
    await pool.query(
      'UPDATE client_products SET product_name = ?, image_url = ? WHERE id = ?',
      [product_name, image_url, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM client_products WHERE id = ?', [req.params.id]);
    res.json((updated as any)[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteClientProduct = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM client_products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};