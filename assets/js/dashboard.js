initVantaBackground('.admin-bg');

const usuario = exigirRole(['aluno', 'editor', 'admin']);

if (usuario) {
  renderAppShell('dashboard');

  document.getElementById('welcome-title').textContent = `Olá, ${usuario.nome.split(' ')[0]}!`;
  document.getElementById('welcome-subtitle').textContent =
    `Você está logado como ${ROLE_LABELS[usuario.role] || usuario.role}.`;

  // "href" ausente = tela ainda não implementada (card fica sem link por enquanto).
  const MENUS = {
    aluno: [
      { icon: 'fa-book-open', label: 'Catálogo de Cursos' },
      { icon: 'fa-chart-line', label: 'Meu Progresso' },
      { icon: 'fa-user', label: 'Minha Conta', href: 'perfil.html' },
    ],
    editor: [
      { icon: 'fa-layer-group', label: 'Gerenciar Cursos', href: 'cursos.html' },
      { icon: 'fa-chalkboard', label: 'Gerenciar Aulas' },
      { icon: 'fa-tags', label: 'Gerenciar Categorias' },
    ],
    admin: [
      { icon: 'fa-users', label: 'Gerenciar Usuários', href: 'usuarios.html' },
      { icon: 'fa-layer-group', label: 'Gerenciar Cursos', href: 'cursos.html' },
      { icon: 'fa-chart-pie', label: 'Relatórios' },
    ],
  };

  const grid = document.getElementById('menu-grid');
  (MENUS[usuario.role] || []).forEach((item) => {
    const card = document.createElement(item.href ? 'a' : 'div');
    if (item.href) card.href = item.href;
    card.className = 'bg-white rounded-xl border border-neutral-200 p-6 flex items-center gap-4 hover:border-accent transition-colors cursor-pointer';
    card.innerHTML = `
      <div class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
        <i class="fa-solid ${item.icon}"></i>
      </div>
      <span class="font-medium text-neutral-700">${item.label}</span>
    `;
    grid.appendChild(card);
  });
}
