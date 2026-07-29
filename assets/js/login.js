initVantaBackground('.login-bg');

const LEMBRAR_KEY = 'loginLembrado';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const rememberInput = document.getElementById('remember');
const togglePasswordBtn = document.getElementById('toggle-password');
const submitBtn = document.getElementById('submit-btn');
const submitBtnText = document.getElementById('submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');
const errorBox = document.getElementById('error-box');
const senhaStrengthContainer = document.getElementById('senha-strength');
const senhaStrengthBar = document.getElementById('senha-strength-bar');
const senhaStrengthLabel = document.getElementById('senha-strength-label');

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

function clearFieldError(inputEl) {
  inputEl.classList.remove('invalid');
  const errorEl = document.querySelector(`[data-error-for="${inputEl.id}"]`);
  if (errorEl) errorEl.textContent = '';
}

function setFieldError(inputEl, message) {
  inputEl.classList.add('invalid');
  const errorEl = document.querySelector(`[data-error-for="${inputEl.id}"]`);
  if (errorEl) errorEl.textContent = message;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Validações "ao vivo" (blur) de cada campo, além da checagem no submit —
// assim o usuário vê o erro assim que sai de um campo vazio/inválido.
function validarEmailCampo() {
  const email = emailInput.value.trim();
  clearFieldError(emailInput);

  if (!email) {
    setFieldError(emailInput, 'Informe seu e-mail.');
    return false;
  }
  if (!isValidEmail(email)) {
    setFieldError(emailInput, 'Informe um e-mail válido.');
    return false;
  }
  return true;
}

function validarSenhaCampo() {
  const senha = senhaInput.value;
  clearFieldError(senhaInput);

  if (!senha) {
    setFieldError(senhaInput, 'Informe sua senha.');
    return false;
  }
  if (senha.length < 6) {
    setFieldError(senhaInput, 'A senha deve ter ao menos 6 caracteres.');
    return false;
  }
  return true;
}

function validateFields() {
  clearFieldErrors();
  const emailValido = validarEmailCampo();
  const senhaValida = validarSenhaCampo();
  return emailValido && senhaValida;
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

// "Lembrar de mim": mantém e-mail/senha preenchidos no formulário para
// os próximos acessos, mesmo depois de sair da conta. Não deve ser
// confundido com saveSession(), que guarda a sessão ativa.
function salvarLembranca(email, senha, remember) {
  if (remember) {
    localStorage.setItem(LEMBRAR_KEY, JSON.stringify({ email, senha }));
  } else {
    localStorage.removeItem(LEMBRAR_KEY);
  }
}

function carregarLembranca() {
  const raw = localStorage.getItem(LEMBRAR_KEY);
  if (!raw) return;

  try {
    const dados = JSON.parse(raw);
    emailInput.value = dados.email || '';
    senhaInput.value = dados.senha || '';
    rememberInput.checked = true;
    senhaInput.dispatchEvent(new Event('input'));
  } catch (err) {
    localStorage.removeItem(LEMBRAR_KEY);
  }
}

function redirectToDashboard() {
  window.location.href = 'dashboard.html';
}

async function attemptLogin(email, senha, remember) {
  hideFormError();

  if (!validateFields()) return;

  setLoading(true);
  try {
    const usuarios = await apiGet(`/usuarios?email=${encodeURIComponent(email)}`);
    const usuario = usuarios[0];

    if (!usuario || usuario.senha !== senha) {
      showFormError('E-mail ou senha inválidos.');
      return;
    }

    if (!usuario.ativo) {
      showFormError('Conta inativa. Entre em contato com o suporte/administrador.');
      return;
    }

    salvarLembranca(email, senha, remember);
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

emailInput.addEventListener('blur', validarEmailCampo);
senhaInput.addEventListener('blur', validarSenhaCampo);

togglePasswordBtn.addEventListener('click', () => {
  const isPassword = senhaInput.type === 'password';
  senhaInput.type = isPassword ? 'text' : 'password';
  togglePasswordBtn.querySelector('.eye-open').classList.toggle('hidden', isPassword);
  togglePasswordBtn.querySelector('.eye-closed').classList.toggle('hidden', !isPassword);
});

// Barra de força de senha: dá um retorno visual conforme a pessoa digita.
function calcularForcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 10) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  if (pontos <= 1) return { percent: 33, label: 'Senha fraca', color: '#ef4444' };
  if (pontos <= 3) return { percent: 66, label: 'Senha média', color: '#f59e0b' };
  return { percent: 100, label: 'Senha forte', color: '#22c55e' };
}

senhaInput.addEventListener('input', () => {
  const senha = senhaInput.value;

  if (!senha) {
    senhaStrengthContainer.classList.add('hidden');
    return;
  }

  const forca = calcularForcaSenha(senha);
  senhaStrengthContainer.classList.remove('hidden');
  senhaStrengthBar.style.width = `${forca.percent}%`;
  senhaStrengthBar.style.backgroundColor = forca.color;
  senhaStrengthLabel.textContent = forca.label;
  senhaStrengthLabel.style.color = forca.color;
});

// --------------------------------------------------------
// MODAL "ESQUECI MINHA SENHA"
// Como não existe envio de e-mail de verdade neste projeto (json-server
// não tem backend de e-mail), a senha temporária gerada é exibida na
// própria tela, simulando o conteúdo que seria enviado por e-mail.
// --------------------------------------------------------
const modalRecuperar = document.getElementById('modal-recuperar');
const formRecuperar = document.getElementById('form-recuperar');
const recuperarEmailInput = document.getElementById('recuperar-email');
const recuperarResultado = document.getElementById('recuperar-resultado');
const btnEnviarRecuperar = document.getElementById('btn-enviar-recuperar');
const btnEnviarRecuperarText = document.getElementById('btn-enviar-recuperar-text');
const recuperarSpinner = btnEnviarRecuperar.querySelector('.spinner');

function abrirModalRecuperar() {
  recuperarResultado.classList.add('hidden');
  formRecuperar.reset();
  clearFieldError(recuperarEmailInput);
  modalRecuperar.classList.remove('hidden');
}

function fecharModalRecuperar() {
  modalRecuperar.classList.add('hidden');
}

function gerarSenhaTemporaria() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let senha = '';
  for (let i = 0; i < 8; i++) {
    senha += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return senha;
}

function mostrarResultadoRecuperar(mensagemHtml, tipo) {
  recuperarResultado.className =
    tipo === 'sucesso'
      ? 'mb-4 rounded-lg text-sm px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800'
      : 'mb-4 rounded-lg text-sm px-4 py-3 bg-red-50 border border-red-200 text-red-700';
  recuperarResultado.innerHTML = mensagemHtml;
  recuperarResultado.classList.remove('hidden');
}

document.getElementById('link-esqueci-senha').addEventListener('click', (event) => {
  event.preventDefault();
  abrirModalRecuperar();
});

document.getElementById('btn-fechar-recuperar').addEventListener('click', fecharModalRecuperar);

formRecuperar.addEventListener('submit', async (event) => {
  event.preventDefault();
  recuperarResultado.classList.add('hidden');

  const email = recuperarEmailInput.value.trim();
  clearFieldError(recuperarEmailInput);

  if (!email || !isValidEmail(email)) {
    setFieldError(recuperarEmailInput, 'Informe um e-mail válido.');
    return;
  }

  btnEnviarRecuperar.disabled = true;
  btnEnviarRecuperarText.textContent = 'Enviando...';
  recuperarSpinner.classList.remove('hidden');

  try {
    const usuarios = await apiGet(`/usuarios?email=${encodeURIComponent(email)}`);
    const usuario = usuarios[0];

    if (!usuario) {
      mostrarResultadoRecuperar('Não encontramos nenhuma conta com esse e-mail.', 'erro');
      return;
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    await apiPatch(`/usuarios/${usuario.id}`, { senha: senhaTemporaria });

    mostrarResultadoRecuperar(
      `Como este é um ambiente de demonstração (sem envio real de e-mail), aqui está a senha temporária:
       <br /><strong class="text-base tracking-wider">${senhaTemporaria}</strong>
       <br />Use-a para entrar e depois defina uma nova senha em "Meu Perfil".`,
      'sucesso'
    );
    formRecuperar.reset();
  } catch (err) {
    mostrarResultadoRecuperar(
      'Não foi possível concluir. Verifique se o json-server está em execução.',
      'erro'
    );
  } finally {
    btnEnviarRecuperar.disabled = false;
    btnEnviarRecuperarText.textContent = 'Enviar';
    recuperarSpinner.classList.add('hidden');
  }
});

(function redirectIfAlreadyLoggedIn() {
  if (getUsuarioLogado()) redirectToDashboard();
})();

(function showSuccessIfJustRegistered() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('cadastrado') === '1') {
    document.getElementById('success-box').classList.remove('hidden');
  }
})();

carregarLembranca();
