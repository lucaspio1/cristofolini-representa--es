import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('sales.db');

// Inicialização das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    cnpj TEXT,
    endereco TEXT,
    responsavel TEXT,
    telefone TEXT,
    email TEXT
  );
  CREATE TABLE IF NOT EXISTS product_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS client_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    image_url TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    cotacao TEXT,
    op_producao TEXT,
    data_emissao_pedido TEXT,
    op_referencia TEXT,
    produto TEXT NOT NULL,
    peso_solicitado REAL,
    qtd_sacos_solicitado INTEGER,
    linha_produto TEXT,
    data_finalizacao_produto TEXT,
    data_entrega_cliente TEXT,
    ordem_compra TEXT,
    comissao_percentage REAL NOT NULL,
    numero_nf TEXT,
    peso_finalizado REAL,
    qtd_sacos_finalizado INTEGER,
    data_faturamento TEXT,
    valor_total_nf REAL NOT NULL,
    fator_kilo REAL,
    commission_value REAL NOT NULL,
    payment_method TEXT DEFAULT 'À VISTA',
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    value REAL NOT NULL,
    payment_date TEXT,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
  );
`);

// Verificações e atualizações de colunas existentes
const tableInfo = db.prepare("PRAGMA table_info(client_products)").all() as any[];
const hasImageUrl = tableInfo.some(col => col.name === 'image_url');

const salesTableInfo = db.prepare("PRAGMA table_info(sales)").all() as any[];
const hasPaymentMethod = salesTableInfo.some(col => col.name === 'payment_method');
if (!hasPaymentMethod) {
  db.exec("ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'À VISTA'");
}

const clientsTableInfo = db.prepare("PRAGMA table_info(clients)").all() as any[];
const hasCnpj = clientsTableInfo.some(col => col.name === 'cnpj');
if (!hasCnpj) {
  try { db.exec("ALTER TABLE clients ADD COLUMN cnpj TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE clients ADD COLUMN endereco TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE clients ADD COLUMN responsavel TEXT"); } catch(e) {}
  try { db.exec("ALTER TABLE clients ADD COLUMN telefone TEXT"); } catch(e) {}
}
const hasEmail = clientsTableInfo.some(col => col.name === 'email');
if (!hasEmail) {
  try { db.exec("ALTER TABLE clients ADD COLUMN email TEXT"); } catch(e) {}
}

// Criação do usuário padrão
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin', 10);
  db.prepare('INSERT INTO users (username, password, name) VALUES (?, ?, ?)').run('admin', hashedPassword, 'Administrador');
}

export default db;