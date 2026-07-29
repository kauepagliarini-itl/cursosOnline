const API_URL = 'http://localhost:3000';

const QUICK_LOGIN_USERS = {
  aluno: { email: 'camila.rocha@email.com', senha: 'senha123' },
  editor: { email: 'eduardo.lima@email.com', senha: 'senha123' },
  admin: { email: 'admin@eduplat.com', senha: 'admin123' },
};

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const rememberInput = document.getElementById('remember');
const togglePasswordBtn = document.getElementById('toggle-password');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = document.getElementById('submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');
const errorBox = document.getElementById('error-box');

function showFormError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function hideFormError() {
  errorBox.classList.add('hidden');
  errorBox.textContent = '';
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.field-input').forEach((el) => el.classList.remove('invalid'));
}

function setFieldError(inputEl, message) {
  inputEl.classList.add('invalid');
  const errorEl = document.querySelector(`[data-error-for="${inputEl.id}"]`);
  if (errorEl) errorEl.textContent = message;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateFields(email, senha) {
  clearFieldErrors();
  let valid = true;

  if (!email) {
    setFieldError(emailInput, 'Informe seu e-mail.');
    valid = false;
  } else if (!isValidEmail(email)) {
    setFieldError(emailInput, 'Informe um e-mail válido.');
    valid = false;
  }

  if (!senha) {
    setFieldError(senhaInput, 'Informe sua senha.');
    valid = false;
  } else if (senha.length < 6) {
    setFieldError(senhaInput, 'A senha deve ter ao menos 6 caracteres.');
    valid = false;
  }

  return valid;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('opacity-70', isLoading);
  submitBtnText.textContent = isLoading ? 'Entrando...' : 'Entrar';
  spinner.classList.toggle('hidden', !isLoading);
}

function saveSession(usuario, remember) {
  const sessionUser = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
  };

  const payload = JSON.stringify(sessionUser);

  if (remember) {
    localStorage.setItem('usuarioLogado', payload);
    sessionStorage.removeItem('usuarioLogado');
  } else {
    sessionStorage.setItem('usuarioLogado', payload);
    localStorage.removeItem('usuarioLogado');
  }
}

function redirectToDashboard() {
  window.location.href = 'dashboard.html';
}

async function attemptLogin(email, senha, remember) {
  hideFormError();

  if (!validateFields(email, senha)) return;

  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/usuarios?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Falha na requisição');

    const usuarios = await response.json();
    const usuario = usuarios[0];

    if (!usuario || usuario.senha !== senha) {
      showFormError('E-mail ou senha inválidos.');
      return;
    }

    if (!usuario.ativo) {
      showFormError('Conta inativa. Entre em contato com o suporte/administrador.');
      return;
    }

    saveSession(usuario, remember);
    redirectToDashboard();
  } catch (err) {
    showFormError('Não foi possível conectar ao servidor. Verifique se o json-server está em execução.');
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  attemptLogin(emailInput.value.trim(), senhaInput.value, rememberInput.checked);
});

togglePasswordBtn.addEventListener('click', () => {
  const isPassword = senhaInput.type === 'password';
  senhaInput.type = isPassword ? 'text' : 'password';
  togglePasswordBtn.querySelector('.eye-open').classList.toggle('hidden', isPassword);
  togglePasswordBtn.querySelector('.eye-closed').classList.toggle('hidden', !isPassword);
});

document.querySelectorAll('[data-quick-login]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const role = btn.getAttribute('data-quick-login');
    const creds = QUICK_LOGIN_USERS[role];
    if (!creds) return;

    emailInput.value = creds.email;
    senhaInput.value = creds.senha;
    attemptLogin(creds.email, creds.senha, rememberInput.checked);
  });
});

(function redirectIfAlreadyLoggedIn() {
  const existing = sessionStorage.getItem('usuarioLogado') || localStorage.getItem('usuarioLogado');
  if (existing) redirectToDashboard();
})();
