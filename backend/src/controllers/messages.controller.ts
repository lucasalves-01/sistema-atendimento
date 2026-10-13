import { FastifyRequest, FastifyReply } from 'fastify';
import { getDbConnection } from '../database/db.js';

export async function enviarMensagem(request: FastifyRequest, reply: FastifyReply) {
  const { id: chamado_id } = request.params as { id: string };
  const { usuario_id, conteudo } = request.body as {
    usuario_id?: number;
    conteudo?: string;
  };

  if (!usuario_id || !conteudo) {
    return reply.status(400).send({
      mensagem: 'Os campos usuario_id e conteudo são obrigatórios.'
    });
  }

  const db = await getDbConnection();

  // Verifica se o chamado existe
  const chamado = await db.get('SELECT id FROM chamados WHERE id = ?', [chamado_id]);
  if (!chamado) {
    return reply.status(404).send({ mensagem: 'Chamado não encontrado.' });
  }

  // Verifica se o usuário existe
  const usuario = await db.get('SELECT id FROM usuarios WHERE id = ?', [usuario_id]);
  if (!usuario) {
    return reply.status(404).send({ mensagem: 'Usuário não encontrado.' });
  }

  const resultado = await db.run(
    'INSERT INTO mensagens (chamado_id, usuario_id, conteudo) VALUES (?, ?, ?)',
    [chamado_id, usuario_id, conteudo]
  );

  return reply.status(201).send({
    mensagem: 'Mensagem enviada com sucesso!',
    mensagemId: resultado.lastID
  });
}

export async function listarMensagens(request: FastifyRequest, reply: FastifyReply) {
  const { id: chamado_id } = request.params as { id: string };
  const db = await getDbConnection();

  // Verifica se o chamado existe
  const chamado = await db.get('SELECT id FROM chamados WHERE id = ?', [chamado_id]);
  if (!chamado) {
    return reply.status(404).send({ mensagem: 'Chamado não encontrado.' });
  }

  const mensagens = await db.all(
    `SELECT 
      m.id, 
      m.chamado_id, 
      m.usuario_id, 
      u.nome as usuario_nome, 
      u.cargo as usuario_cargo, 
      m.conteudo, 
      m.criado_em
    FROM mensagens m
    JOIN usuarios u ON m.usuario_id = u.id
    WHERE m.chamado_id = ?
    ORDER BY m.criado_em ASC`,
    [chamado_id]
  );

  return reply.status(200).send(mensagens);
}