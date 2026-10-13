const API_URL = 'http://localhost:3333';

// Estado global da aplicação
let usuarioLogado = JSON.parse(localStorage.getItem('usuario')) || null;
let chamadoAtivoId = null;
let isCadastroMode = false;

// Elementos da DOM
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const authToggleText = document.getElementById('auth-toggle-text');
const groupNome = document.getElementById('group-nome');
const groupCargo = document.getElementById('group-cargo');

const userNameDisplay = document.getElementById('user-display-name');
const userBadgeDisplay = document.getElementById('user-display-badge');
const btnLogout = document.getElementById('btn-logout');

const newTicketBox = document.getElementById('new-ticket-box');
const ticketForm = document.getElementById('ticket-form');
const ticketsContainer = document.getElementById('tickets-container');

const noTicketSelected = document.getElementById('no-ticket-selected');
const activeTicketCard = document.getElementById('active-ticket-card');
const activeTicketTitle = document.getElementById('active-ticket-title');
const activeTicketMeta = document.getElementById('active-ticket-meta');
const activeTicketStatus = document.getElementById('active-ticket-status');
const activeTicketDescription = document.getElementById('active-ticket-description');
const selectChangeStatus = document.getElementById('select-change-status');

const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  if (usuarioLogado) {
    iniciarSessao();
  } else {
    exibirAuthScreen();
  }
});

// Alternar entre Login e Cadastro
btnToggleAuth.addEventListener('click', () => {
  isCadastroMode = !isCadastroMode;
  if (isCadastroMode) {
    authTitle.textContent = 'Criar Conta';
    authSubtitle.textContent = 'Preencha os dados abaixo para se cadastrar';
    btnAuthSubmit.textContent = 'Cadastrar';
    authToggleText.textContent = 'Já tem uma conta?';
    btnToggleAuth.textContent = 'Faça Login';
    groupNome.style.display = 'flex';
    groupCargo.style.display = 'flex';
  } else {
    authTitle.textContent = 'Entrar no Sistema';
    authSubtitle.textContent = 'Digite suas credenciais para continuar';
    btnAuthSubmit.textContent = 'Entrar';
    authToggleText.textContent = 'Não tem uma conta?';
    btnToggleAuth.textContent = 'Cadastre-se';
    groupNome.style.display = 'none';
    groupCargo.style.display = 'none';
  }
});

// Submit de Login / Cadastro
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    if (isCadastroMode) {
      const nome = document.getElementById('nome').value;
      const cargo = document.getElementById('cargo').value;

      const res = await fetch(`${API_URL}/auth/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, cargo })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem);

      alert('Cadastro realizado com sucesso! Faça login.');
      btnToggleAuth.click();
    } else {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem);

      usuarioLogado = data.usuario;
      localStorage.setItem('usuario', JSON.stringify(usuarioLogado));
      iniciarSessao();
    }
  } catch (err) {
    alert(err.message);
  }
});

// Logout
btnLogout.addEventListener('click', () => {
  localStorage.removeItem('usuario');
  usuarioLogado = null;
  chamadoAtivoId = null;
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
});

function iniciarSessao() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  userNameDisplay.textContent = usuarioLogado.nome;
  userBadgeDisplay.textContent = usuarioLogado.cargo.toUpperCase();
  userBadgeDisplay.className = `badge-status ${usuarioLogado.cargo === 'agente' ? 'em_andamento' : 'aberto'}`;

  // Se for agente, esconde formulário de criar chamado e habilita troca de status
  if (usuarioLogado.cargo === 'agente') {
    newTicketBox.classList.add('hidden');
    selectChangeStatus.classList.remove('hidden');
  } else {
    newTicketBox.classList.remove('hidden');
    selectChangeStatus.classList.add('hidden');
  }

  carregarChamados();
}

// Carregar Lista de Chamados
async function carregarChamados() {
  try {
    const url = usuarioLogado.cargo === 'cliente'
      ? `${API_URL}/chamados?cliente_id=${usuarioLogado.id}`
      : `${API_URL}/chamados`;

    const res = await fetch(url);
    const chamados = await res.json();

    ticketsContainer.innerHTML = '';

    if (chamados.length === 0) {
      ticketsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhum chamado encontrado.</p>';
      return;
    }

    chamados.forEach(c => {
      const item = document.createElement('div');
      item.className = `ticket-item ${c.id === chamadoAtivoId ? 'active' : ''}`;
      item.onclick = () => selecionarChamado(c.id);

      item.innerHTML = `
        <div class="ticket-item-header">
          <strong>#${c.id} - ${c.titulo}</strong>
          <span class="badge-status ${c.status}">${c.status.replace('_', ' ')}</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Cliente: ${c.cliente_nome}</p>
      `;

      ticketsContainer.appendChild(item);
    });
  } catch (err) {
    console.error('Erro ao carregar chamados:', err);
  }
}

// Abrir Novo Chamado (Cliente)
ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('ticket-titulo').value;
  const descricao = document.getElementById('ticket-descricao').value;

  try {
    const res = await fetch(`${API_URL}/chamados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo,
        descricao,
        cliente_id: usuarioLogado.id
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem);

    ticketForm.reset();
    carregarChamados();
    selecionarChamado(data.chamadoId);
  } catch (err) {
    alert(err.message);
  }
});

// Selecionar e Exibir Chamado Ativo
async function selecionarChamado(id) {
  chamadoAtivoId = id;
  noTicketSelected.classList.add('hidden');
  activeTicketCard.classList.remove('hidden');

  carregarChamados(); // Atualiza lista para marcar item ativo

  try {
    // Buscar detalhes do chamado
    const res = await fetch(`${API_URL}/chamados/${id}`);
    const c = await res.json();

    activeTicketTitle.textContent = `#${c.id} - ${c.titulo}`;
    activeTicketMeta.textContent = `Enviado por: ${c.cliente_nome} (${c.cliente_email})`;
    activeTicketStatus.textContent = c.status.replace('_', ' ');
    activeTicketStatus.className = `badge-status ${c.status}`;
    activeTicketDescription.textContent = c.descricao;
    selectChangeStatus.value = c.status;

    carregarMensagens(id);
  } catch (err) {
    console.error('Erro ao carregar detalhes:', err);
  }
}

// Atualizar Status (Agente)
selectChangeStatus.addEventListener('change', async (e) => {
  const novoStatus = e.target.value;
  try {
    const res = await fetch(`${API_URL}/chamados/${chamadoAtivoId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });

    if (!res.ok) throw new Error('Erro ao atualizar status');
    selecionarChamado(chamadoAtivoId);
  } catch (err) {
    alert(err.message);
  }
});

// Carregar Mensagens do Chat
async function carregarMensagens(chamadoId) {
  try {
    const res = await fetch(`${API_URL}/chamados/${chamadoId}/messages` ? `${API_URL}/chamados/${chamadoId}/mensagens` : '');
    const mensagens = await res.json();

    messagesContainer.innerHTML = '';

    mensagens.forEach(m => {
      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${m.usuario_cargo}`;

      const dataFormatada = new Date(m.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      bubble.innerHTML = `
        <div class="message-meta"><strong>${m.usuario_nome}</strong> (${m.usuario_cargo}) - ${dataFormatada}</div>
        <div>${m.conteudo}</div>
      `;

      messagesContainer.appendChild(bubble);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (err) {
    console.error('Erro ao carregar mensagens:', err);
  }
}

// Enviar Mensagem no Chat
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('message-content');
  const conteudo = input.value;

  if (!chamadoAtivoId) return;

  try {
    const res = await fetch(`${API_URL}/chamados/${chamadoAtivoId}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuarioLogado.id,
        conteudo
      })
    });

    if (!res.ok) throw new Error('Erro ao enviar mensagem.');

    input.value = '';
    carregarMensagens(chamadoAtivoId);
  } catch (err) {
    alert(err.message);
  }
});