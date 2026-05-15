import { Request, Response } from 'express';
import db from '../database/db';

// --- CRUD DE CLIENTES ---
export const getClients = (req: Request, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const createClient = (req: Request, res: Response) => {
  const { name, cnpj, endereco, responsavel, telefone, email } = req.body;
  if (!name || !cnpj || !endereco || !responsavel || !telefone || !email) {
    return res.status(400).json({ error: 'All client fields are required' });
  }
  try {
    const info = db.prepare(`INSERT INTO clients (name, cnpj, endereco, responsavel, telefone, email) VALUES (?, ?, ?, ?, ?, ?)`).run(name, cnpj, endereco, responsavel, telefone, email);
    res.json({ id: info.lastInsertRowid, name, cnpj, endereco, responsavel, telefone, email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save client' });
  }
};

export const updateClient = (req: Request, res: Response) => {
  const { name, cnpj, endereco, responsavel, telefone, email } = req.body;
  if (!name || !cnpj || !endereco || !responsavel || !telefone || !email) {
    return res.status(400).json({ error: 'All client fields are required' });
  }
  try {
    db.prepare(`UPDATE clients SET name = ?, cnpj = ?, endereco = ?, responsavel = ?, telefone = ?, email = ? WHERE id = ?`).run(name, cnpj, endereco, responsavel, telefone, email, req.params.id);
    res.json({ id: parseInt(req.params.id), name, cnpj, endereco, responsavel, telefone, email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
};

export const deleteClient = (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
};

// --- CRUD DE PRODUTOS DO CLIENTE ---
export const getClientProducts = (req: Request, res: Response) => {
  try {
    const products = db.prepare('SELECT * FROM client_products WHERE client_id = ? ORDER BY product_name ASC').all(req.params.id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client products' });
  }
};

export const createClientProduct = (req: Request, res: Response) => {
  const { product_name, image_url } = req.body;
  if (!product_name) return res.status(400).json({ error: 'Product name is required' });
  try {
    const info = db.prepare('INSERT INTO client_products (client_id, product_name, image_url) VALUES (?, ?, ?)').run(req.params.id, product_name, image_url || null);
    res.json({ id: info.lastInsertRowid, client_id: parseInt(req.params.id), product_name, image_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save client product' });
  }
};

export const updateClientProduct = (req: Request, res: Response) => {
  const { product_name, image_url } = req.body;
  if (!product_name) return res.status(400).json({ error: 'Product name is required' });
  try {
    db.prepare('UPDATE client_products SET product_name = ?, image_url = ? WHERE id = ?').run(product_name, image_url || null, req.params.id);
    res.json({ id: parseInt(req.params.id), product_name, image_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client product' });
  }
};

export const deleteClientProduct = (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM client_products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client product' });
  }
};