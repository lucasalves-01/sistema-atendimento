import { FastifyRequest, FastifyReply } from 'fastify';
import { getDbConnection } from '../database/db.js';

export async function criarChamado(request: FastifyRequest, reply: FastifyReply) {
  const { titulo, descricao, cliente_id } = request.body as {
    titulo?: string;
    descricao?: string;
    cliente_id?: number;
  };

  if (!titulo || !descricao || !cliente_id) {
    return reply.status(400).send({
      mensagem: 'Os campos titulo, descricao e cliente_id são obrigatórios.'
    });
  }

  const db = await getDbConnection();

  // Verifica se o cliente realmente existe
  const cliente = await db.get('SELECT id FROM usuarios WHERE id = ? AND cargo = "cliente"', [cliente_id]);
  if (!cliente) {
    return reply.status(404).send({ mensagem: 'Cliente não encontrado ou ID inválido.' });
  }

  const resultado = await db.run(
    'INSERT INTO chamados (titulo, descricao, cliente_id) VALUES (?, ?, ?)',
    [titulo, descricao, cliente_id]
  );

  return reply.status(201).send({
    mensagem: 'Chamado aberto com sucesso!',
    chamadoId: resultado.lastID
  });
}

export async function listarChamados(request: FastifyRequest, reply: FastifyReply) {
  const { cliente_id } = request.query as { cliente_id?: string };
  const db = await getDbConnection();

  let query = `
    SELECT 
      c.id, 
      c.titulo, 
      c.descricao, 
      c.status, 
      c.criado_em, 
      u.nome as cliente_nome, 
      u.email as cliente_email
    FROM chamados c
    JOIN usuarios u ON c.cliente_id = u.id
  `;

  const params: any[] = [];

  // Se passar o ID do cliente na URL (?cliente_id=1), filtra só os dele
  if (cliente_id) {
    query += ' WHERE c.cliente_id = ?';
    params.push(cliente_id);
  }

  query += ' ORDER BY c.criado_em DESC';

  const chamados = await db.all(query, params);

  return reply.status(200).send(chamados);
}

export async function obterChamadoPorId(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const db = await getDbConnection();

  const chamado = await db.get(
    `SELECT 
      c.id, 
      c.titulo, 
      c.descricao, 
      c.status, 
      c.criado_em, 
      u.nome as cliente_nome, 
      u.email as cliente_email
    FROM chamados c
    JOIN usuarios u ON c.cliente_id = u.id
    WHERE c.id = ?`,
    [id]
  );

  if (!chamado) {
    return reply.status(404).send({ mensagem: 'Chamado não encontrado.' });
  }

  return reply.status(200).send(chamado);
}

export async function atualizarStatusChamado(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { status } = request.body as { status?: string };

  const statusValidos = ['aberto', 'em_andamento', 'fechado'];
  if (!status || !statusValidos.includes(status)) {
    return reply.status(400).send({
      mensagem: 'Status inválido. Escolha entre: aberto, em_andamento ou fechado.'
    });
  }

  const db = await getDbConnection();

  const resultado = await db.run(
    'UPDATE chamados SET status = ? WHERE id = ?',
    [status, id]
  );

  if (resultado.changes === 0) {
    return reply.status(404).send({ mensagem: 'Chamado não encontrado.' });
  }

  return reply.status(200).send({ mensagem: 'Status do chamado atualizado com sucesso!' });
}