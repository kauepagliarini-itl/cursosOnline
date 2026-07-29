initVantaBackground('.admin-bg');

const usuarioLogado = exigirRole(['aluno', 'editor', 'admin']);

let listaCursos = [];
let listaCategorias = [];
let listaInstrutores = [];
let minhasMatriculas = [];

if (usuarioLogado) {
  renderAppShell('catalogo');
  carregarCatalogo();
}

const grid = document.getElementById('catalogo-grid');
const estadoVazio = document.getElementById('estado-vazio');
const filtroBusca = document.getElementById('filtro-busca');
const filtroCategoria = document.getElementById('filtro-categoria');

async function carregarCatalogo() {
  try {
    const requisicoes = [apiGet('/cursos?status=publicado'), apiGet('/categorias'), apiGet('/usuarios')];
    if (usuarioLogado.role === 'aluno') {
      requisicoes.push(apiGet(`/matriculas?usuarioId=${usuarioLogado.id}`));
    }

    const [cursos, categorias, usuarios, matriculas] = await Promise.all(requisicoes);

    listaCursos = cursos;
    listaCategorias = categorias;
    listaInstrutores = usuarios;
    minhasMatriculas = matriculas || [];

    popularFiltroCategoria();
    renderizarCatalogo(listaCursos);
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar o catálogo. Verifique se o json-server está em execução.', 'error');
  }
}

function popularFiltroCategoria() {
  filtroCategoria.innerHTML = `<option value="">Todas as categorias</option>${listaCategorias
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join('')}`;
}

function nomeCategoriaCatalogo(categoriaId) {
  return listaCategorias.find((c) => c.id === categoriaId)?.nome || '—';
}

function nomeInstrutorCatalogo(instrutorId) {
  return listaInstrutores.find((u) => u.id === instrutorId)?.nome || '—';
}

function matriculaDoCurso(cursoId) {
  return minhasMatriculas.find((m) => m.cursoId === cursoId);
}

function aplicarFiltros() {
  const termo = filtroBusca.value.trim().toLowerCase();
  const categoriaId = filtroCategoria.value;

  const filtrados = listaCursos.filter((curso) => {
    const combinaTermo = !termo || curso.titulo.toLowerCase().includes(termo);
    const combinaCategoria = !categoriaId || curso.categoriaId === categoriaId;
    return combinaTermo && combinaCategoria;
  });

  renderizarCatalogo(filtrados);
}

function cartaoCursoHtml(curso) {
  const matricula = usuarioLogado.role === 'aluno' ? matriculaDoCurso(curso.id) : null;

  let acaoHtml;
  if (usuarioLogado.role !== 'aluno') {
    acaoHtml = '<p class="text-xs text-neutral-400 text-center">Matrícula disponível apenas para alunos.</p>';
  } else if (!matricula) {
    acaoHtml = `
      <button type="button" class="submit-btn" data-matricular="${curso.id}">
        <i class="fa-solid fa-graduation-cap mr-2"></i> Matricular-se
      </button>
    `;
  } else if (matricula.status === 'concluído') {
    acaoHtml = `
      <div class="strength-bar-track mb-2"><div class="strength-bar-fill" style="width:100%;background-color:#22c55e"></div></div>
      <a href="dashboard.html" class="block text-center text-sm font-medium text-emerald-600 hover:underline">
        <i class="fa-solid fa-circle-check mr-1"></i> Concluído — ver no painel
      </a>
    `;
  } else {
    const progresso = matricula.progresso || 0;
    acaoHtml = `
      <div class="strength-bar-track mb-2"><div class="strength-bar-fill" style="width:${progresso}%;background-color:#4C5FBF"></div></div>
      <a href="dashboard.html" class="block text-center text-sm font-medium text-accent hover:underline">
        ${progresso}% concluído — continuar no painel
      </a>
    `;
  }

  return `
    <div class="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col">
      <div class="flex items-start justify-between gap-2 mb-2">
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-50 text-accent-dark">${nomeCategoriaCatalogo(curso.categoriaId)}</span>
        ${
          matricula
            ? `<span class="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                matricula.status === 'concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }">${matricula.status === 'concluído' ? 'Concluído' : 'Matriculado'}</span>`
            : ''
        }
      </div>
      <h3 class="font-semibold text-neutral-800 mb-1">${curso.titulo}</h3>
      <p class="text-sm text-neutral-500 mb-3 line-clamp-3 flex-1">${curso.descricao || 'Sem descrição disponível.'}</p>
      <div class="flex items-center gap-4 text-xs text-neutral-400 mb-4">
        <span><i class="fa-solid fa-clock mr-1"></i>${curso.cargaHoraria}h</span>
        <span><i class="fa-solid fa-chalkboard-user mr-1"></i>${nomeInstrutorCatalogo(curso.instrutorId)}</span>
      </div>
      ${acaoHtml}
    </div>
  `;
}

function renderizarCatalogo(cursos) {
  estadoVazio.classList.toggle('hidden', cursos.length > 0);
  grid.innerHTML = cursos.map((curso) => cartaoCursoHtml(curso)).join('');

  grid.querySelectorAll('[data-matricular]').forEach((btn) => {
    btn.addEventListener('click', () => matricular(btn.dataset.matricular));
  });
}

async function matricular(cursoId) {
  const curso = listaCursos.find((c) => c.id === cursoId);
  if (!curso) return;

  const confirmacao = await Swal.fire({
    title: 'Confirmar matrícula?',
    html: `Você vai se matricular em <strong>"${curso.titulo}"</strong>.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, matricular',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4C5FBF',
  });
  if (!confirmacao.isConfirmed) return;

  try {
    const novaMatricula = await apiPost('/matriculas', {
      usuarioId: usuarioLogado.id,
      cursoId,
      dataMatricula: new Date().toISOString(),
      progresso: 0,
      status: 'em andamento',
    });

    minhasMatriculas.push(novaMatricula);
    aplicarFiltros();
    Swal.fire('Matrícula realizada!', `Você já pode acompanhar "${curso.titulo}" no seu painel.`, 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível concluir a matrícula. Verifique se o json-server está em execução.', 'error');
  }
}

filtroBusca.addEventListener('input', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);
