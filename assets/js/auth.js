function getUsuarioLogado() {
  const raw = sessionStorage.getItem('usuarioLogado') || localStorage.getItem('usuarioLogado');
  return raw ? JSON.parse(raw) : null;
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
