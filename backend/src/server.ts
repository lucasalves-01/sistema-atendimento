import Fastify from 'fastify'
import cors from '@fastify/cors'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fastifyStatic from '@fastify/static'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger: true })
await fastify.register(cors, { origin: true })

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../frontend'),
  prefix: '/',
})

const db = new Database('suportedesk.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'cliente'
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Aberto',
    response TEXT DEFAULT '',
    userId INTEGER
  );
`)

fastify.post('/auth/register', async (request, reply) => {
  const { name, email, password, role } = request.body as any
  const userRole = role === 'atendente' ? 'atendente' : 'cliente'

  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    const result = stmt.run(name, email, password, userRole)
    return reply.send({ success: true, userId: result.lastInsertRowid, role: userRole })
  } catch (error: any) {
    return reply.status(400).send({ success: false, error: error.message || 'E-mail já registado.' })
  }
})

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body as any
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?')
  const user = stmt.get(email, password) as any

  if (!user) {
    return reply.status(401).send({ success: false, error: 'Credenciais inválidas.' })
  }

  return reply.send({ 
    success: true, 
    user: { id: user.id, name: user.name, email: user.email, role: user.role } 
  })
})

fastify.get('/tickets', async (request, reply) => {
  const { userId, role } = request.query as any

  try {
    if (role === 'atendente') {
      const tickets = db.prepare(`
        SELECT tickets.*, COALESCE(users.name, 'Cliente') as clientName 
        FROM tickets 
        LEFT JOIN users ON tickets.userId = users.id 
        ORDER BY tickets.id DESC
      `).all()
      return reply.send(tickets)
    } else {
      const tickets = db.prepare('SELECT * FROM tickets WHERE userId = ? ORDER BY id DESC').all(userId)
      return reply.send(tickets)
    }
  } catch (error: any) {
    console.error('Erro ao listar:', error.message)
    return reply.status(500).send({ error: error.message })
  }
})

fastify.post('/tickets', async (request, reply) => {
  const { title, description, userId } = request.body as any

  try {
    const stmt = db.prepare('INSERT INTO tickets (title, description, status, response, userId) VALUES (?, ?, ?, ?, ?)')
    const result = stmt.run(title, description, 'Aberto', '', userId || 1)
    return reply.send({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    console.error('ERRO DETALHADO SQLITE:', error.message)
    return reply.status(500).send({ success: false, error: error.message })
  }
})

fastify.patch('/tickets/:id', async (request, reply) => {
  const { id } = request.params as any
  const { status, response } = request.body as any

  try {
    const stmt = db.prepare('UPDATE tickets SET status = COALESCE(?, status), response = COALESCE(?, response) WHERE id = ?')
    stmt.run(status, response, id)
    return reply.send({ success: true })
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message })
  }
})

fastify.delete('/tickets/:id', async (request, reply) => {
  const { id } = request.params as any
  try {
    db.prepare('DELETE FROM tickets WHERE id = ?').run(id)
    return reply.send({ success: true })
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message })
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3333 })
    console.log('🚀 Servidor rodando em http://localhost:3333')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()