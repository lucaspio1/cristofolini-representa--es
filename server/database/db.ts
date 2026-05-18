import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

// Cria o Pool de Conexões (Padrão Corporativo para alta performance)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'j|jSP!r4B`:0O34+&+/',
  database: process.env.DB_NAME || 'cristofolini_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Script de Inicialização (Garante que as tabelas existem)
export const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    // 1. Tabela de Clientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cnpj VARCHAR(20),
        endereco TEXT,
        responsavel VARCHAR(255),
        telefone VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabela de Produtos do Cliente
    await connection.query(`
      CREATE TABLE IF NOT EXISTS client_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    // 3. Tabela de Linhas de Produto
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Tabela de Vendas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente VARCHAR(255) NOT NULL,
        cotacao VARCHAR(255),
        op_producao VARCHAR(255),
        data_emissao_pedido DATE,
        op_referencia VARCHAR(255),
        produto VARCHAR(255) NOT NULL,
        peso_solicitado DECIMAL(10,2),
        qtd_sacos_solicitado INT,
        linha_produto VARCHAR(255),
        data_finalizacao_produto DATE,
        data_entrega_cliente DATE,
        ordem_compra VARCHAR(255),
        comissao_percentage DECIMAL(5,2),
        numero_nf VARCHAR(255),
        peso_finalizado DECIMAL(10,2),
        qtd_sacos_finalizado INT,
        data_faturamento DATE,
        valor_total_nf DECIMAL(10,2),
        fator_kilo DECIMAL(10,2),
        commission_value DECIMAL(10,2),
        payment_method VARCHAR(50) DEFAULT 'À VISTA',
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Tabela de Parcelas (Installments)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS installments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        installment_number INT NOT NULL,
        due_date DATE NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        payment_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      )
    `);

// 6. Tabela de Usuários (Agora com a trava de troca de senha)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'USER') DEFAULT 'USER',
        active BOOLEAN DEFAULT TRUE,
        must_change_password BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar usuário Admin padrão (Ele não precisará mudar a senha no 1º login)
    const [users]: any = await connection.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (name, username, password, role, active, must_change_password) VALUES (?, ?, ?, ?, ?, ?)',
        ['Administrador', 'admin', hashedPassword, 'ADMIN', true, false]
      );
      console.log('👤 Usuário Admin padrão criado (Login: admin / Senha: admin123)');
    }

    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
  } catch (error) {
    console.error('❌ FATAL: Erro ao conectar ou criar tabelas no MySQL:', error);
  }
};

export default pool;