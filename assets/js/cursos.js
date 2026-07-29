initVantaBackground('.admin-bg');

const STATUS_LABELS = { rascunho: 'Rascunho', publicado: 'Publicado' };

const usuarioLogado = exigirRole(['editor', 'admin']);

let listaCursos = [];
let listaFiltrada = [];
let listaCategorias = [];
let listaInstrutores = []; // usuários com role "editor" ou "admin"
let paginaAtual = 1;
let itensPorPagina = 10;

if (usuarioLogado) {
  renderAppShell('cursos');
  carregarDados();
}

const tabela = document.getElementById('tabela-cursos');
const estadoVazio = document.getElementById('estado-vazio');

const filtroBusca = document.getElementById('filtro-busca');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroStatus = document.getElementById('filtro-status');

const itensPorPaginaSelect = document.getElementById('itens-por-pagina');
const paginacaoInfo = document.getElementById('paginacao-info');
const btnPaginaAnterior = document.getElementById('btn-pagina-anterior');
const btnPaginaProxima = document.getElementById('btn-pagina-proxima');

const modal = document.getElementById('modal-curso');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-curso');
const idInput = document.getElementById('curso-id');
const tituloInput = document.getElementById('curso-titulo');
const descricaoInput = document.getElementById('curso-descricao');
const categoriaInput = document.getElementById('curso-categoria');
const instrutorInput = document.getElementById('curso-instrutor');
const cargaHorariaInput = document.getElementById('curso-carga-horaria');
const statusInput = document.getElementById('curso-status');
const submitBtn = document.getElementById('modal-submit-btn');
const submitBtnText = document.getElementById('modal-submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');

async function carregarDados() {
  try {
    const [cursos, categorias, usuarios] = await Promise.all([
      apiGet('/cursos'),
      apiGet('/categorias'),
      apiGet('/usuarios'),
    ]);

    listaCursos = cursos;
    listaCategorias = categorias;
    listaInstrutores = usuarios.filter((u) => u.role === 'editor' || u.role === 'admin');

    popularSelectsFixos();
    aplicarFiltros();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar os cursos. Verifique se o json-server está em execução.', 'error');
  }
}

function nomeCategoria(categoriaId) {
  return listaCategorias.find((c) => c.id === categoriaId)?.nome || '—';
}

function nomeInstrutor(instrutorId) {
  return listaInstrutores.find((u) => u.id === instrutorId)?.nome || '—';
}

function popularSelectsFixos() {
  const opcoesCategorias = listaCategorias
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join('');

  filtroCategoria.innerHTML = `<option value="">Todas as categorias</option>${opcoesCategorias}`;
  categoriaInput.innerHTML = `<option value="">Selecione...</option>${opcoesCategorias}`;

  instrutorInput.innerHTML = listaInstrutores.length
    ? `<option value="">Selecione...</option>${listaInstrutores
        .map((u) => `<option value="${u.id}">${u.nome} (${ROLE_LABELS[u.role]})</option>`)
        .join('')}`
    : '<option value="">Nenhum editor/admin cadastrado</option>';
}

function aplicarFiltros() {
  const termo = filtroBusca.value.trim().toLowerCase();
  const categoriaId = filtroCategoria.value;
  const status = filtroStatus.value;

  listaFiltrada = listaCursos.filter((curso) => {
    const combinaTermo = !termo || curso.titulo.toLowerCase().includes(termo);
    const combinaCategoria = !categoriaId || curso.categoriaId === categoriaId;
    const combinaStatus = !status || curso.status === status;
    return combinaTermo && combinaCategoria && combinaStatus;
  });

  paginaAtual = 1;
  renderizarCursos();
}

function renderizarCursos() {
  const totalItens = listaFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  paginaAtual = Math.min(Math.max(paginaAtual, 1), totalPaginas);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const paginaDeCursos = listaFiltrada.slice(inicio, inicio + itensPorPagina);

  tabela.innerHTML = '';
  estadoVazio.classList.toggle('hidden', totalItens > 0);

  paginaDeCursos.forEach((curso) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="px-5 py-3"><span class="font-semibold text-neutral-800">${curso.titulo}</span></td>
      <td class="px-5 py-3 text-neutral-500">${nomeCategoria(curso.categoriaId)}</td>
      <td class="px-5 py-3 text-neutral-500">${nomeInstrutor(curso.instrutorId)}</td>
      <td class="px-5 py-3 text-neutral-500">${curso.cargaHoraria}h</td>
      <td class="px-5 py-3">
        <span class="text-xs font-medium px-2.5 py-1 rounded-full ${
          curso.status === 'publicado' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'
        }">${STATUS_LABELS[curso.status] || curso.status}</span>
      </td>
      <td class="px-5 py-3 text-right whitespace-nowrap">
        <button class="action-btn action-btn-edit" data-acao="editar" data-id="${curso.id}">
          <i class="fa-solid fa-pen"></i>
          <span class="action-btn-label">Editar</span>
        </button>
        <button class="action-btn action-btn-delete" data-acao="excluir" data-id="${curso.id}">
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
    btn.addEventListener('click', () => excluirCurso(btn.dataset.id));
  });

  const fim = totalItens === 0 ? 0 : Math.min(inicio + itensPorPagina, totalItens);
  paginacaoInfo.textContent = totalItens === 0 ? 'Nenhum resultado' : `${inicio + 1}–${fim} de ${totalItens}`;
  btnPaginaAnterior.disabled = paginaAtual <= 1;
  btnPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

filtroBusca.addEventListener('input', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);
filtroStatus.addEventListener('change', aplicarFiltros);

itensPorPaginaSelect.addEventListener('change', () => {
  itensPorPagina = parseInt(itensPorPaginaSelect.value, 10);
  paginaAtual = 1;
  renderizarCursos();
});

btnPaginaAnterior.addEventListener('click', () => {
  paginaAtual--;
  renderizarCursos();
});

btnPaginaProxima.addEventListener('click', () => {
  paginaAtual++;
  renderizarCursos();
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

// Validações "ao vivo" (blur), além da checagem completa no submit.
function validarTituloCampo() {
  const titulo = tituloInput.value.trim();
  clearFieldError(tituloInput);

  if (titulo.length < 5) {
    setFieldError(tituloInput, 'O título deve ter no mínimo 5 caracteres.');
    return false;
  }
  return true;
}

function validarCategoriaCampo() {
  clearFieldError(categoriaInput);

  if (!categoriaInput.value) {
    setFieldError(categoriaInput, 'Selecione uma categoria.');
    return false;
  }
  return true;
}

function validarInstrutorCampo() {
  clearFieldError(instrutorInput);

  if (!instrutorInput.value) {
    setFieldError(instrutorInput, 'Selecione um instrutor.');
    return false;
  }
  return true;
}

function validarCargaHorariaCampo() {
  const valor = Number(cargaHorariaInput.value);
  clearFieldError(cargaHorariaInput);

  if (!cargaHorariaInput.value || !Number.isFinite(valor) || valor <= 0) {
    setFieldError(cargaHorariaInput, 'Informe uma carga horária positiva.');
    return false;
  }
  return true;
}

tituloInput.addEventListener('blur', validarTituloCampo);
categoriaInput.addEventListener('change', validarCategoriaCampo);
instrutorInput.addEventListener('change', validarInstrutorCampo);
cargaHorariaInput.addEventListener('blur', validarCargaHorariaCampo);

function abrirModal() {
  clearFieldErrors();
  modal.classList.remove('hidden');
}

function fecharModal() {
  modal.classList.add('hidden');
  form.reset();
}

function abrirModalNovoCurso() {
  if (!listaCategorias.length) {
    Swal.fire('Nenhuma categoria cadastrada', 'Cadastre uma categoria antes de criar um curso.', 'info');
    return;
  }
  if (!listaInstrutores.length) {
    Swal.fire('Nenhum instrutor disponível', 'É preciso ter ao menos um usuário editor ou admin para ser o instrutor.', 'info');
    return;
  }

  modalTitulo.textContent = 'Novo Curso';
  idInput.value = '';
  categoriaInput.value = '';
  instrutorInput.value = '';
  statusInput.value = 'rascunho';
  abrirModal();
}

function abrirModalEdicao(id) {
  const curso = listaCursos.find((c) => c.id === id);
  if (!curso) return;

  modalTitulo.textContent = 'Editar Curso';
  idInput.value = curso.id;
  tituloInput.value = curso.titulo;
  descricaoInput.value = curso.descricao || '';
  categoriaInput.value = curso.categoriaId;
  instrutorInput.value = curso.instrutorId;
  cargaHorariaInput.value = curso.cargaHoraria;
  statusInput.value = curso.status;

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
  const tituloValido = validarTituloCampo();
  const categoriaValida = validarCategoriaCampo();
  const instrutorValido = validarInstrutorCampo();
  const cargaHorariaValida = validarCargaHorariaCampo();
  return tituloValido && categoriaValida && instrutorValido && cargaHorariaValida;
}

async function salvarCurso(event) {
  event.preventDefault();

  if (!validarFormulario()) return;

  const id = idInput.value;
  const criando = !id;
  const dados = {
    titulo: tituloInput.value.trim(),
    descricao: descricaoInput.value.trim(),
    categoriaId: categoriaInput.value,
    instrutorId: instrutorInput.value,
    cargaHoraria: Number(cargaHorariaInput.value),
    status: statusInput.value,
  };

  setLoading(true);
  try {
    if (criando) {
      await apiPost('/cursos', dados);
    } else {
      await apiPatch(`/cursos/${id}`, dados);
    }

    fecharModal();
    await carregarDados();
    Swal.fire('Sucesso!', criando ? 'Curso cadastrado com sucesso.' : 'Curso atualizado com sucesso.', 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível salvar o curso. Verifique se o json-server está em execução.', 'error');
  } finally {
    setLoading(false);
  }
}

async function excluirCurso(id) {
  const curso = listaCursos.find((c) => c.id === id);
  if (!curso) return;

  const confirmacao = await Swal.fire({
    title: 'Excluir curso?',
    html: `O curso <strong>"${curso.titulo}"</strong> será removido permanentemente. Esta ação não pode ser desfeita.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });
  if (!confirmacao.isConfirmed) return;

  try {
    await apiDelete(`/cursos/${id}`);
    await carregarDados();
    Swal.fire('Excluído!', `O curso "${curso.titulo}" foi removido.`, 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível excluir o curso.', 'error');
  }
}

document.getElementById('btn-novo-curso').addEventListener('click', abrirModalNovoCurso);
document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);
form.addEventListener('submit', salvarCurso);
