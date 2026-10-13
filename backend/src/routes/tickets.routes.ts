import { FastifyInstance } from 'fastify';

export async function ticketsRoutes(app: FastifyInstance) {
  // Listar chamados
  app.get('/tickets', async (request: any, reply: any) => {
    const db = request.server.db;
    if (!db) return reply.status(500).send({ error: 'Erro de conexão com o banco de dados.' });

    try {
      const tickets = await db.all('SELECT * FROM tickets ORDER BY id DESC');
      return reply.status(200).send(tickets);
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar chamados.' });
    }
  });

  // Criar novo chamado
  app.post('/tickets', async (request: any, reply: any) => {
    const db = request.server.db;
    const { title, description, user_id } = request.body || {};

    if (!db) return reply.status(500).send({ error: 'Erro de conexão com o banco de dados.' });
    if (!title || !description) return reply.status(400).send({ error: 'Título e descrição são obrigatórios.' });

    try {
      const result = await db.run(
        'INSERT INTO tickets (title, description, status, user_id) VALUES (?, ?, ?, ?)',
        [title, description, 'Aberto', user_id || 1]
      );
      return reply.status(201).send({ message: 'Chamado criado com sucesso!', id: result.lastID });
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao criar chamado.' });
    }
  });

  // Excluir chamado pelo ID
  app.delete('/tickets/:id', async (request: any, reply: any) => {
    const db = request.server.db;
    const { id } = request.params;

    if (!db) return reply.status(500).send({ error: 'Erro de conexão com o banco de dados.' });

    try {
      await db.run('DELETE FROM tickets WHERE id = ?', [id]);
      return reply.status(200).send({ message: 'Chamado excluído com sucesso!' });
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao excluir chamado.' });
    }
  });
}

export default ticketsRoutes;