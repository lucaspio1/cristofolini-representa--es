import { Request, Response } from 'express';
import pool from '../database/db';

// Função auxiliar para transformar textos vazios em NULL para o MySQL não reclamar
const safeDate = (val: string | undefined | null) => (val && val.trim() !== '') ? val : null;

export const getSales = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sales ORDER BY sale_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

export const createSale = async (req: Request, res: Response) => {
  const { 
    cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
    produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
    data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
    comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
    data_faturamento, valor_total_nf, fator_kilo, payment_method, installments 
  } = req.body;
  
  if (!produto || valor_total_nf === undefined || comissao_percentage === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const commission_value = (valor_total_nf * comissao_percentage) / 100;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    
    const [info]: any = await connection.query(`
      INSERT INTO sales (
        cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
        produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
        data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
        comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
        data_faturamento, valor_total_nf, fator_kilo, commission_value, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cliente, cotacao, op_producao, safeDate(data_emissao_pedido), op_referencia, 
      produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
      safeDate(data_finalizacao_produto), safeDate(data_entrega_cliente), ordem_compra, 
      comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
      safeDate(data_faturamento), valor_total_nf, fator_kilo, commission_value, payment_method || 'À VISTA'
    ]);

    const saleId = info.insertId;

    if (payment_method === 'A PRAZO' && Array.isArray(installments)) {
      for (const inst of installments) {
        await connection.query(`
          INSERT INTO installments (sale_id, installment_number, due_date, value)
          VALUES (?, ?, ?, ?)
        `, [saleId, inst.installment_number, safeDate(inst.due_date), inst.value]);
      }
    }

    await connection.commit();
    
    const [savedSale] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    res.json((savedSale as any)[0]);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to save sale' });
  } finally {
    connection.release();
  }
};

export const updateSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
    produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
    data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
    comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
    data_faturamento, valor_total_nf, fator_kilo, payment_method, installments 
  } = req.body;
  
  const commission_value = (valor_total_nf * comissao_percentage) / 100;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    
    await connection.query(`
      UPDATE sales SET
        cliente = ?, cotacao = ?, op_producao = ?, data_emissao_pedido = ?, op_referencia = ?, 
        produto = ?, peso_solicitado = ?, qtd_sacos_solicitado = ?, linha_produto = ?, 
        data_finalizacao_produto = ?, data_entrega_cliente = ?, ordem_compra = ?, 
        comissao_percentage = ?, numero_nf = ?, peso_finalizado = ?, qtd_sacos_finalizado = ?, 
        data_faturamento = ?, valor_total_nf = ?, fator_kilo = ?, commission_value = ?,
        payment_method = ?
      WHERE id = ?
    `, [
      cliente, cotacao, op_producao, safeDate(data_emissao_pedido), op_referencia, 
      produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
      safeDate(data_finalizacao_produto), safeDate(data_entrega_cliente), ordem_compra, 
      comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
      safeDate(data_faturamento), valor_total_nf, fator_kilo, commission_value,
      payment_method || 'À VISTA', id
    ]);

    await connection.query('DELETE FROM installments WHERE sale_id = ?', [id]);
    
    if (payment_method === 'A PRAZO' && Array.isArray(installments)) {
      for (const inst of installments) {
        await connection.query(`
          INSERT INTO installments (sale_id, installment_number, due_date, value, payment_date)
          VALUES (?, ?, ?, ?, ?)
        `, [id, inst.installment_number, safeDate(inst.due_date), inst.value, safeDate(inst.payment_date)]);
      }
    }

    await connection.commit();
    
    const [updatedSale] = await pool.query('SELECT * FROM sales WHERE id = ?', [id]);
    res.json((updatedSale as any)[0]);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to update sale' });
  } finally {
    connection.release();
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};

export const getSaleInstallments = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM installments WHERE sale_id = ? ORDER BY installment_number ASC', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch installments' });
  }
};