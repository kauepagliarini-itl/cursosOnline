initVantaBackground('.admin-bg');

const usuarioLogado = exigirRole(['editor', 'admin']);

const cursoId = new URLSearchParams(window.location.search).get('cursoId');

let cursoAtual = null;
let listaAulas = [];

if (usuarioLogado) {
  renderAppShell('cursos');
  if (!cursoId) {
    Swal.fire('Curso não especificado', 'Volte para "Gerenciar Cursos" e escolha um curso primeiro.', 'error').then(() => {
      window.location.href = '/html/cursos.html';
    });
  } else {
    carregarDados();
  }
}

const contextoTitulo = document.getElementById('curso-titulo-contexto');
const tabela = document.getElementById('tabela-aulas');
const estadoVazio = document.getElementById('estado-vazio');

const modal = document.getElementById('modal-aula');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-aula');
const idInput = document.getElementById('aula-id');
const tituloInput = document.getElementById('aula-titulo');
const ordemInput = document.getElementById('aula-ordem');
const duracaoInput = document.getElementById('aula-duracao');
const conteudoInput = document.getElementById('aula-conteudo');
const submitBtn = document.getElementById('modal-submit-btn');
const submitBtnText = document.getElementById('modal-submit-btn-text');
const spinner = submitBtn.querySelector('.spinner');

async function carregarDados() {
  try {
    const [curso, aulas] = await Promise.all([apiGet(`/cursos/${cursoId}`), apiGet(`/aulas?cursoId=${cursoId}`)]);
    cursoAtual = curso;
    listaAulas = aulas.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    contextoTitulo.textContent = curso.titulo;
    document.title = `Aulas de ${curso.titulo} | Plataforma de Cursos Online`;
    renderizarAulas();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar as aulas. Verifique se o json-server está em execução.', 'error');
  }
}

function renderizarAulas() {
  estadoVazio.classList.toggle('hidden', listaAulas.length > 0);
  tabela.innerHTML = listaAulas
    .map(
      (aula) => `
      <tr>
        <td class="px-5 py-3 text-neutral-500">${aula.ordem}</td>
        <td class="px-5 py-3"><span class="font-semibold text-neutral-800">${aula.titulo}</span></td>
        <td class="px-5 py-3 text-neutral-500">${aula.duracaoMinutos}min</td>
        <td class="px-5 py-3 text-right whitespace-nowrap">
          <button class="action-btn action-btn-edit" data-acao="editar" data-id="${aula.id}">
            <i class="fa-solid fa-pen"></i>
            <span class="action-btn-label">Editar</span>
          </button>
          <button class="action-btn action-btn-delete" data-acao="excluir" data-id="${aula.id}">
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
    btn.addEventListener('click', () => excluirAula(btn.dataset.id));
  });
}

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

function validarTituloCampo() {
  const titulo = tituloInput.value.trim();
  clearFieldError(tituloInput);
  if (!titulo) {
    setFieldError(tituloInput, 'Informe o título da aula.');
    return false;
  }
  return true;
}

function validarOrdemCampo() {
  const valor = Number(ordemInput.value);
  clearFieldError(ordemInput);
  if (!ordemInput.value || !Number.isInteger(valor) || valor <= 0) {
    setFieldError(ordemInput, 'Informe um número inteiro positivo.');
    return false;
  }
  return true;
}

function validarDuracaoCampo() {
  const valor = Number(duracaoInput.value);
  clearFieldError(duracaoInput);
  if (!duracaoInput.value || !Number.isFinite(valor) || valor <= 0) {
    setFieldError(duracaoInput, 'Informe uma duração positiva.');
    return false;
  }
  return true;
}

tituloInput.addEventListener('blur', validarTituloCampo);
ordemInput.addEventListener('blur', validarOrdemCampo);
duracaoInput.addEventListener('blur', validarDuracaoCampo);

function abrirModal() {
  clearFieldErrors();
  modal.classList.remove('hidden');
}

function fecharModal() {
  modal.classList.add('hidden');
  form.reset();
}

function abrirModalNovaAula() {
  modalTitulo.textContent = 'Nova Aula';
  idInput.value = '';
  const proximaOrdem = listaAulas.length ? Math.max(...listaAulas.map((a) => a.ordem || 0)) + 1 : 1;
  ordemInput.value = proximaOrdem;
  abrirModal();
}

function abrirModalEdicao(id) {
  const aula = listaAulas.find((a) => a.id === id);
  if (!aula) return;

  modalTitulo.textContent = 'Editar Aula';
  idInput.value = aula.id;
  tituloInput.value = aula.titulo;
  ordemInput.value = aula.ordem;
  duracaoInput.value = aula.duracaoMinutos;
  conteudoInput.value = aula.conteudo || '';
  abrirModal();
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('opacity-70', isLoading);
  submitBtnText.textContent = isLoading ? 'Salvando...' : 'Salvar';
  spinner.classList.toggle('hidden', !isLoading);
}

async function salvarAula(event) {
  event.preventDefault();

  const tituloValido = validarTituloCampo();
  const ordemValida = validarOrdemCampo();
  const duracaoValida = validarDuracaoCampo();
  if (!tituloValido || !ordemValida || !duracaoValida) return;

  const id = idInput.value;
  const criando = !id;
  const dados = {
    cursoId,
    titulo: tituloInput.value.trim(),
    ordem: Number(ordemInput.value),
    duracaoMinutos: Number(duracaoInput.value),
    conteudo: conteudoInput.value.trim(),
  };

  setLoading(true);
  try {
    if (criando) {
      await apiPost('/aulas', dados);
    } else {
      await apiPatch(`/aulas/${id}`, dados);
    }

    fecharModal();
    await carregarDados();
    Swal.fire('Sucesso!', criando ? 'Aula cadastrada com sucesso.' : 'Aula atualizada com sucesso.', 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível salvar a aula. Verifique se o json-server está em execução.', 'error');
  } finally {
    setLoading(false);
  }
}

async function excluirAula(id) {
  const aula = listaAulas.find((a) => a.id === id);
  if (!aula) return;

  const confirmacao = await Swal.fire({
    title: 'Excluir aula?',
    html: `A aula <strong>"${aula.titulo}"</strong> será removida permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });
  if (!confirmacao.isConfirmed) return;

  try {
    await apiDelete(`/aulas/${id}`);
    await carregarDados();
    Swal.fire('Excluída!', `A aula "${aula.titulo}" foi removida.`, 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível excluir a aula.', 'error');
  }
}

document.getElementById('btn-nova-aula').addEventListener('click', abrirModalNovaAula);
document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);
form.addEventListener('submit', salvarAula);
