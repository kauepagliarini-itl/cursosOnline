// App shell compartilhado pelas telas internas (dashboard, usuarios, perfil...):
// topbar fixa + sidebar lateral + avatar com dropdown. Requer auth.js carregado
// antes (usa getUsuarioLogado/configurarLogout/ROLE_LABELS).

const AVATAR_PRESETS = [
  { id: 'cat', icon: 'fa-cat', label: 'Gato', bg: '#FDE68A', fg: '#92400E' },
  { id: 'dog', icon: 'fa-dog', label: 'Cachorro', bg: '#BFDBFE', fg: '#1E3A8A' },
  { id: 'dove', icon: 'fa-dove', label: 'Pombo', bg: '#E9D5FF', fg: '#6B21A8' },
  { id: 'fish', icon: 'fa-fish', label: 'Peixe', bg: '#A7F3D0', fg: '#065F46' },
  { id: 'frog', icon: 'fa-frog', label: 'Sapo', bg: '#D9F99D', fg: '#3F6212' },
  { id: 'hippo', icon: 'fa-hippo', label: 'Hipopótamo', bg: '#FBCFE8', fg: '#9D174D' },
  { id: 'horse', icon: 'fa-horse', label: 'Cavalo', bg: '#FED7AA', fg: '#9A3412' },
  { id: 'otter', icon: 'fa-otter', label: 'Lontra', bg: '#C7D2FE', fg: '#3730A3' },
];

function getAvatarPreset(id) {
  return AVATAR_PRESETS.find((preset) => preset.id === id);
}

// Monta o miniatura do avatar (foto enviada, ícone de animal ou iniciais como
// último recurso). O container (botão/circulo) define o tamanho via CSS.
function avatarInnerHtml(usuario) {
  if (usuario.avatarTipo === 'upload' && usuario.avatarValor) {
    return `<img src="${usuario.avatarValor}" alt="Foto de ${usuario.nome}" class="avatar-img" />`;
  }

  if (usuario.avatarTipo === 'preset' && usuario.avatarValor) {
    const preset = getAvatarPreset(usuario.avatarValor);
    if (preset) {
      return `<span class="avatar-circle" style="background:${preset.bg};color:${preset.fg}"><i class="fa-solid ${preset.icon}"></i></span>`;
    }
  }

  const inicial = (usuario.nome || '?').trim().charAt(0).toUpperCase();
  return `<span class="avatar-circle avatar-circle-initial">${inicial}</span>`;
}

const SIDEBAR_MENU = {
  aluno: [
    { id: 'dashboard', icon: 'fa-house', label: 'Painel', href: 'dashboard.html' },
    { id: 'cursos', icon: 'fa-book-open', label: 'Catálogo de Cursos' },
    { id: 'progresso', icon: 'fa-chart-line', label: 'Meu Progresso' },
    { id: 'perfil', icon: 'fa-user', label: 'Minha Conta', href: 'perfil.html' },
  ],
  editor: [
    { id: 'dashboard', icon: 'fa-house', label: 'Painel', href: 'dashboard.html' },
    { id: 'cursos', icon: 'fa-layer-group', label: 'Gerenciar Cursos' },
    { id: 'aulas', icon: 'fa-chalkboard', label: 'Gerenciar Aulas' },
    { id: 'categorias', icon: 'fa-tags', label: 'Gerenciar Categorias' },
    { id: 'perfil', icon: 'fa-user', label: 'Minha Conta', href: 'perfil.html' },
  ],
  admin: [
    { id: 'dashboard', icon: 'fa-house', label: 'Painel', href: 'dashboard.html' },
    { id: 'usuarios', icon: 'fa-users', label: 'Gerenciar Usuários', href: 'usuarios.html' },
    { id: 'cursos', icon: 'fa-layer-group', label: 'Gerenciar Cursos' },
    { id: 'relatorios', icon: 'fa-chart-pie', label: 'Relatórios' },
    { id: 'perfil', icon: 'fa-user', label: 'Minha Conta', href: 'perfil.html' },
  ],
};

function sidebarLinkHtml(item, activeId) {
  const classes = ['sidebar-link'];
  if (item.id === activeId) classes.push('sidebar-link-active');
  if (!item.href) classes.push('sidebar-link-disabled');

  const conteudo = `
    <i class="fa-solid ${item.icon} sidebar-link-icon"></i>
    <span class="sidebar-link-label">${item.label}</span>
    ${!item.href ? '<span class="sidebar-badge">em breve</span>' : ''}
  `;

  return item.href
    ? `<a href="${item.href}" class="${classes.join(' ')}" title="${item.label}">${conteudo}</a>`
    : `<div class="${classes.join(' ')}" title="${item.label}" aria-disabled="true">${conteudo}</div>`;
}

// Injeta a topbar + sidebar no início do <body> e prepara os eventos.
// activeId identifica o item do menu lateral a destacar (ex: 'dashboard').
function renderAppShell(activeId) {
  const usuario = getUsuarioLogado();
  if (!usuario) return;

  const itens = SIDEBAR_MENU[usuario.role] || [];

  document.body.classList.add('has-app-shell');
  document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <header class="shell-topbar">
      <div class="shell-topbar-inner">
        <button id="sidebar-toggle-mobile" type="button" class="shell-icon-btn" aria-label="Abrir menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <button id="sidebar-toggle-desktop" type="button" class="shell-icon-btn shell-icon-btn-desktop" aria-label="Recolher menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <a href="dashboard.html" class="shell-brand">
          <i class="fa-solid fa-graduation-cap text-accent text-xl"></i>
          <span class="font-semibold text-slate-800 hidden sm:inline">EduPlat</span>
        </a>
        <div class="flex-1"></div>
        <div class="relative" id="avatar-menu-root">
          <button id="avatar-btn" type="button" class="avatar-btn" aria-haspopup="true" aria-expanded="false" aria-label="Menu do usuário">
            ${avatarInnerHtml(usuario)}
          </button>
          <div id="avatar-dropdown" class="avatar-dropdown hidden">
            <div class="avatar-dropdown-header">
              <div class="avatar-dropdown-img">${avatarInnerHtml(usuario)}</div>
              <div class="min-w-0">
                <p class="avatar-dropdown-nome">${usuario.nome}</p>
                <p class="avatar-dropdown-role">${ROLE_LABELS[usuario.role] || usuario.role}</p>
              </div>
            </div>
            <a href="perfil.html" class="avatar-dropdown-item">
              <i class="fa-solid fa-id-card"></i> Informações da conta
            </a>
            <button id="shell-logout-btn" type="button" class="avatar-dropdown-item avatar-dropdown-item-danger">
              <i class="fa-solid fa-right-from-bracket"></i> Sair do sistema
            </button>
          </div>
        </div>
      </div>
    </header>

    <div id="sidebar-backdrop" class="sidebar-backdrop hidden"></div>

    <aside id="app-sidebar" class="app-sidebar">
      <nav class="app-sidebar-nav">
        ${itens.map((item) => sidebarLinkHtml(item, activeId)).join('')}
      </nav>
    </aside>
    `
  );

  configurarShellEventos();
}

function configurarShellEventos() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const btnMobile = document.getElementById('sidebar-toggle-mobile');
  const btnDesktop = document.getElementById('sidebar-toggle-desktop');
  const avatarBtn = document.getElementById('avatar-btn');
  const avatarDropdown = document.getElementById('avatar-dropdown');

  function abrirSidebarMobile() {
    sidebar.classList.add('app-sidebar-open');
    backdrop.classList.remove('hidden');
  }

  function fecharSidebarMobile() {
    sidebar.classList.remove('app-sidebar-open');
    backdrop.classList.add('hidden');
  }

  btnMobile.addEventListener('click', abrirSidebarMobile);
  backdrop.addEventListener('click', fecharSidebarMobile);
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', fecharSidebarMobile));

  const colapsada = localStorage.getItem('sidebarColapsada') === '1';
  document.body.classList.toggle('sidebar-collapsed', colapsada);

  btnDesktop.addEventListener('click', () => {
    const novoEstado = !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', novoEstado);
    localStorage.setItem('sidebarColapsada', novoEstado ? '1' : '0');
  });

  function fecharAvatarDropdown() {
    avatarDropdown.classList.add('hidden');
    avatarBtn.setAttribute('aria-expanded', 'false');
  }

  avatarBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const abrindo = avatarDropdown.classList.contains('hidden');
    avatarDropdown.classList.toggle('hidden', !abrindo);
    avatarBtn.setAttribute('aria-expanded', String(abrindo));
  });

  document.addEventListener('click', (event) => {
    if (!avatarDropdown.contains(event.target) && event.target !== avatarBtn) {
      fecharAvatarDropdown();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    fecharAvatarDropdown();
    fecharSidebarMobile();
  });

  configurarLogout('shell-logout-btn');
}
