import { FastifyInstance } from 'fastify';
import { cadastrarUsuario, loginUsuario } from '../controllers/auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  // Suporta chamadas com ou sem o prefixo /auth para não dar 404
  app.post('/cadastrar', cadastrarUsuario);
  app.post('/auth/cadastrar', cadastrarUsuario);

  app.post('/login', loginUsuario);
  app.post('/auth/login', loginUsuario);
}

export default authRoutes;