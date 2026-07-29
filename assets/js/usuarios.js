initVantaBackground('.admin-bg');

const usuarioLogado = exigirRole(['admin']);

let listaUsuarios = [];
let listaFiltrada = [];
let paginaAtual = 1;
let itensPorPagina = 10;

if (usuarioLogado) {
  renderAppShell('usuarios');
  carregarUsuarios();
}

const tabela = document.getElementById('tabela-usuarios');
const estadoVazio = document.getElementById('estado-vazio');

const filtroBusca = document.getElementById('filtro-busca');
const filtroRole = document.getElementById('filtro-role');
const filtroStatus = document.getElementById('filtro-status');

const itensPorPaginaSelect = document.getElementById('itens-por-pagina');
const paginacaoInfo = document.getElementById('paginacao-info');
const btnPaginaAnterior = document.getElementById('btn-pagina-anterior');
const btnPaginaProxima = document.getElementById('btn-pagina-proxima');

const modal = document.getElementById('modal-usuario');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-usuario');
const idInput = document.getElementById('usuario-id');
const nomeInput = document.getElementById('usuario-nome');
const emailInput = document.getElementById('usuario-email');
const senhaInput = document.getElementById('usuario-senha');
const senhaOpcionalLabel = document.getElementById('senha-opcional-label');
const roleInput = document.getElementById('usuario-role');
const ativoInput = document.getElementById('usuario-ativo');
const submitBtn = document.getElementById('modal-submit-btn');
const submitBtnText = document.getElementById('modal-submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');

async function carregarUsuarios() {
  try {
    listaUsuarios = await apiGet('/usuarios');
    aplicarFiltros();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar os usuários. Verifique se o json-server está em execução.', 'error');
  }
}

function aplicarFiltros() {
  const termo = filtroBusca.value.trim().toLowerCase();
  const role = filtroRole.value;
  const status = filtroStatus.value;

  listaFiltrada = listaUsuarios.filter((usuario) => {
    const combinaTermo =
      !termo ||
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo);
    const combinaRole = !role || usuario.role === role;
    const combinaStatus = !status || (status === 'ativo' ? usuario.ativo : !usuario.ativo);
    return combinaTermo && combinaRole && combinaStatus;
  });

  paginaAtual = 1;
  renderizarUsuarios();
}

function renderizarUsuarios() {
  const totalItens = listaFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  paginaAtual = Math.min(Math.max(paginaAtual, 1), totalPaginas);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const paginaDeUsuarios = listaFiltrada.slice(inicio, inicio + itensPorPagina);

  tabela.innerHTML = '';
  estadoVazio.classList.toggle('hidden', totalItens > 0);

  paginaDeUsuarios.forEach((usuario) => {
    const ehEuMesmo = usuario.id === usuarioLogado.id;
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="px-5 py-3"><span class="font-semibold text-neutral-800">${usuario.nome}</span>${ehEuMesmo ? ' <span class="text-xs text-neutral-400">(você)</span>' : ''}</td>
      <td class="px-5 py-3 text-neutral-500">${usuario.email}</td>
      <td class="px-5 py-3">${ROLE_LABELS[usuario.role] || usuario.role}</td>
      <td class="px-5 py-3">
        <span class="text-xs font-medium px-2.5 py-1 rounded-full ${
          usuario.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'
        }">${usuario.ativo ? 'Ativo' : 'Inativo'}</span>
      </td>
      <td class="px-5 py-3 text-right whitespace-nowrap">
        <button class="action-btn action-btn-edit" data-acao="editar" data-id="${usuario.id}">
          <i class="fa-solid fa-pen"></i>
          <span class="action-btn-label">Editar</span>
        </button>
        <button
          class="action-btn action-btn-delete"
          data-acao="excluir"
          data-id="${usuario.id}"
          ${ehEuMesmo ? 'disabled title="Você não pode excluir sua própria conta."' : ''}
        >
          <i class="fa-solid fa-trash"></i>
          <span class="action-btn-label">Excluir</span>
        </button>
      </td>
    `;

    tabela.appendChild(tr);
  });

  tabela.querySelectorAll('button[data-acao="editar"]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalEdicao(btn.dataset.id));
  });

  tabela.querySelectorAll('button[data-acao="excluir"]').forEach((btn) => {
    if (!btn.disabled) btn.addEventListener('click', () => excluirUsuario(btn.dataset.id));
  });

  const fim = totalItens === 0 ? 0 : Math.min(inicio + itensPorPagina, totalItens);
  paginacaoInfo.textContent = totalItens === 0 ? 'Nenhum resultado' : `${inicio + 1}–${fim} de ${totalItens}`;
  btnPaginaAnterior.disabled = paginaAtual <= 1;
  btnPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

filtroBusca.addEventListener('input', aplicarFiltros);
filtroRole.addEventListener('change', aplicarFiltros);
filtroStatus.addEventListener('change', aplicarFiltros);

itensPorPaginaSelect.addEventListener('change', () => {
  itensPorPagina = parseInt(itensPorPaginaSelect.value, 10);
  paginaAtual = 1;
  renderizarUsuarios();
});

btnPaginaAnterior.addEventListener('click', () => {
  paginaAtual--;
  renderizarUsuarios();
});

btnPaginaProxima.addEventListener('click', () => {
  paginaAtual++;
  renderizarUsuarios();
});

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.modal-input').forEach((el) => el.classList.remove('invalid'));
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

function estaCriando() {
  return !idInput.value;
}

// Validações "ao vivo" (blur), além da checagem completa no submit.
function validarNomeCampo() {
  const nome = nomeInput.value.trim();
  clearFieldError(nomeInput);

  if (nome.length < 3) {
    setFieldError(nomeInput, 'O nome deve ter no mínimo 3 caracteres.');
    return false;
  }
  return true;
}

function validarEmailCampo() {
  const email = emailInput.value.trim();
  clearFieldError(emailInput);

  if (!isValidEmail(email)) {
    setFieldError(emailInput, 'Informe um e-mail válido.');
    return false;
  }
  return true;
}

function validarSenhaCampo() {
  const senha = senhaInput.value;
  clearFieldError(senhaInput);

  if ((estaCriando() || senha) && senha.length < 6) {
    setFieldError(senhaInput, 'A senha deve ter ao menos 6 caracteres.');
    return false;
  }
  return true;
}

nomeInput.addEventListener('blur', validarNomeCampo);
emailInput.addEventListener('blur', validarEmailCampo);
senhaInput.addEventListener('blur', validarSenhaCampo);

function abrirModal() {
  clearFieldErrors();
  modal.classList.remove('hidden');
}

function fecharModal() {
  modal.classList.add('hidden');
  form.reset();
}

function abrirModalNovoUsuario() {
  modalTitulo.textContent = 'Novo Usuário';
  idInput.value = '';
  senhaOpcionalLabel.classList.add('hidden');
  roleInput.disabled = false;
  ativoInput.disabled = false;
  ativoInput.checked = true;
  roleInput.value = 'aluno';
  abrirModal();
}

function abrirModalEdicao(id) {
  const usuario = listaUsuarios.find((u) => u.id === id);
  if (!usuario) return;

  const ehEuMesmo = usuario.id === usuarioLogado.id;

  modalTitulo.textContent = 'Editar Usuário';
  idInput.value = usuario.id;
  nomeInput.value = usuario.nome;
  emailInput.value = usuario.email;
  senhaInput.value = '';
  senhaOpcionalLabel.classList.remove('hidden');
  roleInput.value = usuario.role;
  ativoInput.checked = usuario.ativo;

  // Trava de segurança: o admin não pode rebaixar o próprio perfil
  // nem desativar a própria conta (evita ficar sem acesso ao painel).
  roleInput.disabled = ehEuMesmo;
  ativoInput.disabled = ehEuMesmo;

  abrirModal();
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('opacity-70', isLoading);
  submitBtnText.textContent = isLoading ? 'Salvando...' : 'Salvar';
  spinner.classList.toggle('hidden', !isLoading);
}

function validarFormulario() {
  clearFieldErrors();
  const nomeValido = validarNomeCampo();
  const emailValido = validarEmailCampo();
  const senhaValida = validarSenhaCampo();
  return nomeValido && emailValido && senhaValida;
}

async function salvarUsuario(event) {
  event.preventDefault();

  const id = idInput.value;
  const criando = !id;
  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  const role = roleInput.value;
  const ativo = ativoInput.checked;

  if (!validarFormulario()) return;

  const duplicado = listaUsuarios.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id
  );
  if (duplicado) {
    setFieldError(emailInput, 'Este e-mail já está em uso por outro usuário.');
    return;
  }

  // Trava de confirmação: editar um usuário existente é uma ação sensível
  // (pode mudar perfil/status dele), então confirmamos antes de aplicar.
  if (!criando) {
    const confirmacao = await Swal.fire({
      title: 'Salvar alterações?',
      text: `Deseja realmente aplicar as alterações no usuário "${nome}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4C5FBF',
    });
    if (!confirmacao.isConfirmed) return;
  }

  setLoading(true);
  try {
    if (criando) {
      await apiPost('/usuarios', { nome, email, senha, role, ativo });
    } else {
      const dados = { nome, email, role, ativo };
      if (senha) dados.senha = senha;
      await apiPatch(`/usuarios/${id}`, dados);
    }

    fecharModal();
    await carregarUsuarios();
    Swal.fire(
      'Sucesso!',
      criando ? 'Usuário cadastrado com sucesso.' : 'Usuário atualizado com sucesso.',
      'success'
    );
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível salvar o usuário. Verifique se o json-server está em execução.', 'error');
  } finally {
    setLoading(false);
  }
}

async function excluirUsuario(id) {
  const usuario = listaUsuarios.find((u) => u.id === id);
  if (!usuario) return;

  const confirmacao = await Swal.fire({
    title: 'Excluir usuário?',
    html: `O usuário <strong>"${usuario.nome}"</strong> será removido permanentemente. Esta ação não pode ser desfeita.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });
  if (!confirmacao.isConfirmed) return;

  try {
    await apiDelete(`/usuarios/${id}`);
    await carregarUsuarios();
    Swal.fire('Excluído!', `O usuário "${usuario.nome}" foi removido.`, 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível excluir o usuário.', 'error');
  }
}

document.getElementById('btn-novo-usuario').addEventListener('click', abrirModalNovoUsuario);
document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);
form.addEventListener('submit', salvarUsuario);
