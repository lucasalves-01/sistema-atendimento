import { FastifyInstance } from 'fastify';
import { enviarMensagem, listarMensagens } from '../controllers/messages.controller.js';

export async function messagesRoutes(server: FastifyInstance) {
  server.post('/chamados/:id/mensagens', enviarMensagem);
  server.get('/chamados/:id/mensagens', listarMensagens);
}