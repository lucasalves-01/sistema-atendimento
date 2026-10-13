import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database | null = null;

export async function getDbConnection() {
  if (dbInstance) {
    return dbInstance;
  }

  // Cria ou abre o arquivo físico do banco de dados
  dbInstance = await open({
    filename: path.join(__dirname, 'banco.sqlite'),
    driver: sqlite3.Database
  });

  // Habilita suporte a chaves estrangeiras (Foreign Keys)
  await dbInstance.exec('PRAGMA foreign_keys = ON;');

  // Inicializa as tabelas do sistema
  await initDb(dbInstance);

  return dbInstance;
}

async function initDb(db: Database) {
  await db.exec(`
    -- Tabela de Usuários (Clientes e Agentes de Suporte)
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cargo TEXT NOT NULL CHECK(cargo IN ('cliente', 'agente')),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de Chamados / Tickets
    CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aberto' CHECK(status IN ('aberto', 'em_andamento', 'fechado')),
      cliente_id INTEGER NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    -- Tabela de Mensagens do Chamado
    CREATE TABLE IF NOT EXISTS mensagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chamado_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      conteudo TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
  `);

  console.log('📦 Banco de dados SQL inicializado e tabelas verificadas!');
}