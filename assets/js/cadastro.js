initVantaBackground('.login-bg');

const form = document.getElementById('cadastro-form');
const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const confirmarSenhaInput = document.getElementById('confirmarSenha');
const roleInput = document.getElementById('role');
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

// Validações "ao vivo" (blur), além da checagem completa no submit.
function validarNomeCampo() {
  const nome = nomeInput.value.trim();
  clearFieldError(nomeInput);

  if (!nome) {
    setFieldError(nomeInput, 'Informe seu nome completo.');
    return false;
  }
  if (nome.length < 3) {
    setFieldError(nomeInput, 'O nome deve ter no mínimo 3 caracteres.');
    return false;
  }
  return true;
}

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
    setFieldError(senhaInput, 'Informe uma senha.');
    return false;
  }
  if (senha.length < 6) {
    setFieldError(senhaInput, 'A senha deve ter ao menos 6 caracteres.');
    return false;
  }
  return true;
}

function validarConfirmarSenhaCampo() {
  const confirmarSenha = confirmarSenhaInput.value;
  clearFieldError(confirmarSenhaInput);

  if (!confirmarSenha) {
    setFieldError(confirmarSenhaInput, 'Confirme sua senha.');
    return false;
  }
  if (confirmarSenha !== senhaInput.value) {
    setFieldError(confirmarSenhaInput, 'As senhas não coincidem.');
    return false;
  }
  return true;
}

function validateFields() {
  clearFieldErrors();
  const nomeValido = validarNomeCampo();
  const emailValido = validarEmailCampo();
  const senhaValida = validarSenhaCampo();
  const confirmacaoValida = validarConfirmarSenhaCampo();
  return nomeValido && emailValido && senhaValida && confirmacaoValida;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('opacity-70', isLoading);
  submitBtnText.textContent = isLoading ? 'Cadastrando...' : 'Cadastrar';
  spinner.classList.toggle('hidden', !isLoading);
}

async function attemptCadastro(nome, email, senha, role) {
  hideFormError();

  if (!validateFields()) return;

  setLoading(true);
  try {
    const existentes = await apiGet(`/usuarios?email=${encodeURIComponent(email)}`);
    if (existentes.length > 0) {
      showFormError('Este e-mail já está cadastrado. Tente outro ou faça login.');
      return;
    }

    await apiPost('/usuarios', { nome, email, senha, role, ativo: true });

    window.location.href = 'index.html?cadastrado=1';
  } catch (err) {
    showFormError('Não foi possível conectar ao servidor. Verifique se o json-server está em execução.');
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  attemptCadastro(nomeInput.value.trim(), emailInput.value.trim(), senhaInput.value, roleInput.value);
});

nomeInput.addEventListener('blur', validarNomeCampo);
emailInput.addEventListener('blur', validarEmailCampo);
senhaInput.addEventListener('blur', validarSenhaCampo);
confirmarSenhaInput.addEventListener('blur', validarConfirmarSenhaCampo);

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
