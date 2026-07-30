initVantaBackground('.admin-bg');

const usuarioLogado = exigirRole(['editor', 'admin']);

let listaCategorias = [];
let listaCursos = [];
let listaFiltrada = [];

if (usuarioLogado) {
  renderAppShell('categorias');
  carregarDados();
}

const tabela = document.getElementById('tabela-categorias');
const estadoVazio = document.getElementById('estado-vazio');
const filtroBusca = document.getElementById('filtro-busca');

const modal = document.getElementById('modal-categoria');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-categoria');
const idInput = document.getElementById('categoria-id');
const nomeInput = document.getElementById('categoria-nome');
const descricaoInput = document.getElementById('categoria-descricao');
const submitBtn = document.getElementById('modal-submit-btn');
const submitBtnText = document.getElementById('modal-submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');

async function carregarDados() {
  try {
    const [categorias, cursos] = await Promise.all([apiGet('/categorias'), apiGet('/cursos')]);
    listaCategorias = categorias;
    listaCursos = cursos;
    aplicarFiltros();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar as categorias. Verifique se o json-server está em execução.', 'error');
  }
}

function qtdCursos(categoriaId) {
  return listaCursos.filter((c) => c.categoriaId === categoriaId).length;
}

function aplicarFiltros() {
  const termo = filtroBusca.value.trim().toLowerCase();
  listaFiltrada = listaCategorias.filter((cat) => !termo || cat.nome.toLowerCase().includes(termo));
  renderizarCategorias();
}

function renderizarCategorias() {
  estadoVazio.classList.toggle('hidden', listaFiltrada.length > 0);
  tabela.innerHTML = listaFiltrada
    .map(
      (cat) => `
      <tr>
        <td class="px-5 py-3"><span class="font-semibold text-neutral-800">${cat.nome}</span></td>
        <td class="px-5 py-3 text-neutral-500">${cat.descricao || '—'}</td>
        <td class="px-5 py-3 text-neutral-500">${qtdCursos(cat.id)}</td>
        <td class="px-5 py-3 text-right whitespace-nowrap">
          <button class="action-btn action-btn-edit" data-acao="editar" data-id="${cat.id}">
            <i class="fa-solid fa-pen"></i>
            <span class="action-btn-label">Editar</span>
          </button>
          <button
            class="action-btn action-btn-delete"
            data-acao="excluir"
            data-id="${cat.id}"
            ${qtdCursos(cat.id) > 0 ? 'disabled title="Existem cursos vinculados a esta categoria."' : ''}
          >
            <i class="fa-solid fa-trash"></i>
            <span class="action-btn-label">Excluir</span>
          </button>
        </td>
      </tr>
    `
    )
    .join('');

  tabela.querySelectorAll('button[data-acao="editar"]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalEdicao(btn.dataset.id));
  });
  tabela.querySelectorAll('button[data-acao="excluir"]').forEach((btn) => {
    if (!btn.disabled) btn.addEventListener('click', () => excluirCategoria(btn.dataset.id));
  });
}

filtroBusca.addEventListener('input', aplicarFiltros);

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

function validarNomeCampo() {
  const nome = nomeInput.value.trim();
  clearFieldError(nomeInput);

  if (!nome) {
    setFieldError(nomeInput, 'Informe o nome da categoria.');
    return false;
  }

  const id = idInput.value;
  const duplicado = listaCategorias.find((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== id);
  if (duplicado) {
    setFieldError(nomeInput, 'Já existe uma categoria com este nome.');
    return false;
  }

  return true;
}

nomeInput.addEventListener('blur', validarNomeCampo);

function abrirModal() {
  clearFieldErrors();
  modal.classList.remove('hidden');
}

function fecharModal() {
  modal.classList.add('hidden');
  form.reset();
}

function abrirModalNovaCategoria() {
  modalTitulo.textContent = 'Nova Categoria';
  idInput.value = '';
  abrirModal();
}

function abrirModalEdicao(id) {
  const categoria = listaCategorias.find((c) => c.id === id);
  if (!categoria) return;

  modalTitulo.textContent = 'Editar Categoria';
  idInput.value = categoria.id;
  nomeInput.value = categoria.nome;
  descricaoInput.value = categoria.descricao || '';
  abrirModal();
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('opacity-70', isLoading);
  submitBtnText.textContent = isLoading ? 'Salvando...' : 'Salvar';
  spinner.classList.toggle('hidden', !isLoading);
}

async function salvarCategoria(event) {
  event.preventDefault();

  if (!validarNomeCampo()) return;

  const id = idInput.value;
  const criando = !id;
  const dados = {
    nome: nomeInput.value.trim(),
    descricao: descricaoInput.value.trim(),
  };

  setLoading(true);
  try {
    if (criando) {
      await apiPost('/categorias', dados);
    } else {
      await apiPatch(`/categorias/${id}`, dados);
    }

    fecharModal();
    await carregarDados();
    Swal.fire('Sucesso!', criando ? 'Categoria cadastrada com sucesso.' : 'Categoria atualizada com sucesso.', 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível salvar a categoria. Verifique se o json-server está em execução.', 'error');
  } finally {
    setLoading(false);
  }
}

async function excluirCategoria(id) {
  const categoria = listaCategorias.find((c) => c.id === id);
  if (!categoria) return;

  const confirmacao = await Swal.fire({
    title: 'Excluir categoria?',
    html: `A categoria <strong>"${categoria.nome}"</strong> será removida permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });
  if (!confirmacao.isConfirmed) return;

  try {
    await apiDelete(`/categorias/${id}`);
    await carregarDados();
    Swal.fire('Excluída!', `A categoria "${categoria.nome}" foi removida.`, 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível excluir a categoria.', 'error');
  }
}

document.getElementById('btn-nova-categoria').addEventListener('click', abrirModalNovaCategoria);
document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);
form.addEventListener('submit', salvarCategoria);
