import { Request, Response } from 'express';
import db from '../database/db';

export const getSales = (req: Request, res: Response) => {
  try {
    const sales = db.prepare('SELECT * FROM sales ORDER BY sale_date DESC').all();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

export const createSale = (req: Request, res: Response) => {
  const { 
    cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
    produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
    data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
    comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
    data_faturamento, valor_total_nf, fator_kilo, payment_method, installments 
  } = req.body;
  
  if (!produto || valor_total_nf === undefined || comissao_percentage === undefined) {
    return res.status(400).json({ error: 'Missing required fields (produto, valor_total_nf, comissao_percentage)' });
  }

  const commission_value = (valor_total_nf * comissao_percentage) / 100;

  const transaction = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO sales (
        cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
        produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
        data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
        comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
        data_faturamento, valor_total_nf, fator_kilo, commission_value, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
      produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
      data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
      comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
      data_faturamento, valor_total_nf, fator_kilo, commission_value, payment_method || 'À VISTA'
    );

    const saleId = info.lastInsertRowid;

    if (payment_method === 'A PRAZO' && Array.isArray(installments)) {
      const instStmt = db.prepare(`
        INSERT INTO installments (sale_id, installment_number, due_date, value)
        VALUES (?, ?, ?, ?)
      `);
      for (const inst of installments) {
        instStmt.run(saleId, inst.installment_number, inst.due_date, inst.value);
      }
    }

    return saleId;
  });

  try {
    const saleId = transaction();
    const savedSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    res.json(savedSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save sale' });
  }
};

export const updateSale = (req: Request, res: Response) => {
  const { id } = req.params;
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

  const transaction = db.transaction(() => {
    const stmt = db.prepare(`
      UPDATE sales SET
        cliente = ?, cotacao = ?, op_producao = ?, data_emissao_pedido = ?, op_referencia = ?, 
        produto = ?, peso_solicitado = ?, qtd_sacos_solicitado = ?, linha_produto = ?, 
        data_finalizacao_produto = ?, data_entrega_cliente = ?, ordem_compra = ?, 
        comissao_percentage = ?, numero_nf = ?, peso_finalizado = ?, qtd_sacos_finalizado = ?, 
        data_faturamento = ?, valor_total_nf = ?, fator_kilo = ?, commission_value = ?,
        payment_method = ?
      WHERE id = ?
    `);
    
    stmt.run(
      cliente, cotacao, op_producao, data_emissao_pedido, op_referencia, 
      produto, peso_solicitado, qtd_sacos_solicitado, linha_produto, 
      data_finalizacao_produto, data_entrega_cliente, ordem_compra, 
      comissao_percentage, numero_nf, peso_finalizado, qtd_sacos_finalizado, 
      data_faturamento, valor_total_nf, fator_kilo, commission_value,
      payment_method || 'À VISTA',
      id
    );

    db.prepare('DELETE FROM installments WHERE sale_id = ?').run(id);
    if (payment_method === 'A PRAZO' && Array.isArray(installments)) {
      const instStmt = db.prepare(`
        INSERT INTO installments (sale_id, installment_number, due_date, value, payment_date)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const inst of installments) {
        instStmt.run(id, inst.installment_number, inst.due_date, inst.value, inst.payment_date || null);
      }
    }
  });

  try {
    transaction();
    const updatedSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    res.json(updatedSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
};

export const deleteSale = (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};

export const getSaleInstallments = (req: Request, res: Response) => {
  try {
    const installments = db.prepare('SELECT * FROM installments WHERE sale_id = ? ORDER BY installment_number ASC').all(req.params.id);
    res.json(installments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch installments' });
  }
};