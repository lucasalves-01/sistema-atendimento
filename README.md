# 🎧 Sistema de Atendimento e Helpdesk

Aplicação Full-Stack desenvolvida para gestão e suporte a chamados em tempo real. O sistema conta com controle de acesso baseado em funções (RBAC - Cliente e Agente), autenticação JWT, chat de mensagens integrado e exclusão em cascata de dados.

---

## 🚀 Tecnologias Utilizadas

### **Backend**
- **Node.js** & **TypeScript**
- **Fastify (v4)** — Framework web de alta performance
- **SQLite3** — Banco de dados relacional com integridade referencial (`PRAGMA foreign_keys = ON`)
- **@fastify/jwt** — Autenticação via JSON Web Token
- **@fastify/cors** & **@fastify/static** — Suporte a requisições cross-origin e servidor de arquivos estáticos

### **Frontend**
- **HTML5, CSS3 & JavaScript Moderno (ES6+)**
- Design responsivo no formato Dashboard
- Integração assíncrona via `fetch` API

---

## 🛠️ Funcionalidades

- [x] **Autenticação & Autorização:** Cadastro e Login de usuários com diferenciação de papéis (`client` vs `agent`).
- [x] **Gestão de Chamados (CRUD):**
  - Clientes podem abrir chamados com título e descrição.
  - Painel para acompanhamento de chamados.
  - Agentes podem alterar o status (`Aberto`, `Em Andamento`, `Fechado`).
  - Remoção de chamados com exclusão em cascata das mensagens associadas.
- [x] **Sistema de Mensagens:** Chat interno vinculado a cada chamado ativo.

---

## 📁 Estrutura do Projeto