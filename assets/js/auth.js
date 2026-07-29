const ROLE_LABELS = { aluno: 'Aluno', editor: 'Editor', admin: 'Administrador' };

function getUsuarioLogado() {
  const raw = sessionStorage.getItem('usuarioLogado') || localStorage.getItem('usuarioLogado');
  return raw ? JSON.parse(raw) : null;
}

// Atualiza o usuário da sessão ativa (localStorage ou sessionStorage, o que
// já estiver em uso) sem exigir novo login — usado após editar o perfil.
function atualizarUsuarioLogado(patch) {
  const usuarioAtual = getUsuarioLogado();
  if (!usuarioAtual) return null;

  const atualizado = { ...usuarioAtual, ...patch };
  const payload = JSON.stringify(atualizado);

  if (sessionStorage.getItem('usuarioLogado')) {
    sessionStorage.setItem('usuarioLogado', payload);
  } else {
    localStorage.setItem('usuarioLogado', payload);
  }

  return atualizado;
}

function logout() {
  sessionStorage.removeItem('usuarioLogado');
  localStorage.removeItem('usuarioLogado');
  window.location.href = 'index.html';
}

// Garante que só usuários com um dos "roles" permitidos acessem a tela.
// Sem sessão -> volta pro login. Sessão sem o role certo -> volta pro dashboard.
function exigirRole(rolesPermitidos) {
  const usuario = getUsuarioLogado();

  if (!usuario) {
    window.location.href = 'index.html';
    return null;
  }

  if (!rolesPermitidos.includes(usuario.role)) {
    window.location.href = 'dashboard.html';
    return null;
  }

  return usuario;
}

function configurarLogout(botaoId = 'logout-btn') {
  const btn = document.getElementById(botaoId);
  if (btn) btn.addEventListener('click', logout);
}
