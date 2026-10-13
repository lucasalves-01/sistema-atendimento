export async function cadastrarUsuario(request: any, reply: any) {
  // Pega o banco de dados injetado pelo app.decorate em server.ts
  const db = request.server.db;

  if (!db) {
    return reply.status(500).send({ error: 'Erro de conexão com o banco de dados.' });
  }

  try {
    const { nome, name, email, senha, password, tipo, role } = request.body || {};

    const finalName = nome || name;
    const finalPassword = senha || password;
    const finalRole = tipo || role || 'client';

    if (!finalName || !email || !finalPassword) {
      return reply.status(400).send({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Verifica se e-mail já existe
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return reply.status(400).send({ error: 'E-mail já cadastrado.' });
    }

    // Insere o novo usuário no banco
    await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [finalName, email, finalPassword, finalRole]
    );

    return reply.status(201).send({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return reply.status(400).send({ error: 'E-mail já cadastrado.' });
    }
    return reply.status(500).send({ error: 'Erro interno no servidor ao cadastrar.' });
  }
}

export async function loginUsuario(request: any, reply: any) {
  const db = request.server.db;

  if (!db) {
    return reply.status(500).send({ error: 'Erro de conexão com o banco de dados.' });
  }

  try {
    const { email, senha, password } = request.body || {};
    const finalPassword = senha || password;

    if (!email || !finalPassword) {
      return reply.status(400).send({ error: 'Informe e-mail e senha.' });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, finalPassword]
    );

    if (!user) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos.' });
    }

    return reply.status(200).send({
      message: 'Login realizado com sucesso!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: 'token-simulado-12345'
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    return reply.status(500).send({ error: 'Erro interno no servidor ao realizar login.' });
  }
}

export const cadastrar = cadastrarUsuario;
export const login = loginUsuario;