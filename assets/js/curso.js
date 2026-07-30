initVantaBackground('.admin-bg');

const usuarioLogado = exigirRole(['aluno', 'editor', 'admin']);
const cursoId = new URLSearchParams(window.location.search).get('cursoId');

let cursoAtual = null;
let matriculaAtual = null;
let avaliacaoAtual = null;
let notaSelecionada = 0;

if (usuarioLogado) {
  renderAppShell(usuarioLogado.role === 'aluno' ? 'catalogo' : 'cursos');
  if (!cursoId) {
    Swal.fire('Curso não especificado', 'Volte para o catálogo e escolha um curso.', 'error').then(() => {
      window.location.href = '/html/catalogo.html';
    });
  } else {
    carregarCurso();
  }
}

function nomeCategoria(categorias, categoriaId) {
  return categorias.find((c) => c.id === categoriaId)?.nome || '—';
}

function nomeInstrutor(usuarios, instrutorId) {
  return usuarios.find((u) => u.id === instrutorId)?.nome || '—';
}

async function carregarCurso() {
  try {
    const [curso, categorias, usuarios, aulas] = await Promise.all([
      apiGet(`/cursos/${cursoId}`),
      apiGet('/categorias'),
      apiGet('/usuarios'),
      apiGet(`/aulas?cursoId=${cursoId}`),
    ]);

    cursoAtual = curso;

    document.title = `${curso.titulo} | Plataforma de Cursos Online`;
    document.getElementById('curso-titulo').textContent = curso.titulo;
    document.getElementById('curso-descricao').textContent = curso.descricao || 'Sem descrição disponível.';
    document.getElementById('curso-categoria-badge').textContent = nomeCategoria(categorias, curso.categoriaId);
    document.getElementById('curso-carga-horaria').textContent = curso.cargaHoraria;
    document.getElementById('curso-instrutor').textContent = nomeInstrutor(usuarios, curso.instrutorId);

    renderizarAulas(aulas.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));

    if (usuarioLogado.role === 'aluno') {
      const [matriculas, avaliacoes] = await Promise.all([
        apiGet(`/matriculas?usuarioId=${usuarioLogado.id}&cursoId=${cursoId}`),
        apiGet(`/avaliacoes?usuarioId=${usuarioLogado.id}&cursoId=${cursoId}`),
      ]);
      matriculaAtual = matriculas[0] || null;
      avaliacaoAtual = avaliacoes[0] || null;
      renderizarAreaAluno();
    }
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar o curso. Verifique se o json-server está em execução.', 'error');
  }
}

function renderizarAulas(aulas) {
  const container = document.getElementById('lista-aulas');
  document.getElementById('aulas-vazio').classList.toggle('hidden', aulas.length > 0);

  container.innerHTML = aulas
    .map(
      (aula) => `
      <div class="flex items-center justify-between gap-3 border border-neutral-100 rounded-lg px-4 py-3">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-7 h-7 rounded-full bg-accent-50 text-accent-dark text-xs font-semibold flex items-center justify-center flex-shrink-0">${aula.ordem}</span>
          <span class="text-sm text-neutral-700 truncate">${aula.titulo}</span>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="text-xs text-neutral-400">${aula.duracaoMinutos}min</span>
          ${
            aula.conteudo
              ? `<a href="${aula.conteudo}" target="_blank" rel="noopener" class="text-accent hover:underline text-xs font-medium"><i class="fa-solid fa-play mr-1"></i>Assistir</a>`
              : ''
          }
        </div>
      </div>
    `
    )
    .join('');
}

function renderizarAreaAluno() {
  const secaoMatricula = document.getElementById('secao-matricula');
  const secaoMatricular = document.getElementById('secao-matricular');
  const secaoAvaliacao = document.getElementById('secao-avaliacao');
  const badge = document.getElementById('curso-matricula-badge');

  if (!matriculaAtual) {
    secaoMatricular.classList.remove('hidden');
    secaoMatricula.classList.add('hidden');
    secaoAvaliacao.classList.add('hidden');
    return;
  }

  const concluido = matriculaAtual.status === 'concluído';

  badge.classList.remove('hidden');
  badge.textContent = concluido ? 'Concluído' : 'Matriculado';
  badge.classList.add(concluido ? 'bg-emerald-100' : 'bg-amber-100', concluido ? 'text-emerald-700' : 'text-amber-700');

  secaoMatricular.classList.add('hidden');
  secaoMatricula.classList.remove('hidden');

  const progresso = matriculaAtual.progresso || 0;
  document.getElementById('progresso-slider').value = progresso;
  atualizarVisualProgresso(progresso);

  if (concluido) {
    secaoAvaliacao.classList.remove('hidden');
    renderizarAvaliacao();
  } else {
    secaoAvaliacao.classList.add('hidden');
  }
}

function atualizarVisualProgresso(valor) {
  document.getElementById('progresso-valor-texto').textContent = `${valor}%`;
  document.getElementById('progresso-barra').style.width = `${valor}%`;
  document.getElementById('progresso-barra').style.backgroundColor = Number(valor) >= 100 ? '#22c55e' : '#4C5FBF';
}

const sliderProgresso = document.getElementById('progresso-slider');
sliderProgresso.addEventListener('input', () => atualizarVisualProgresso(sliderProgresso.value));

document.getElementById('btn-salvar-progresso').addEventListener('click', async () => {
  const novoProgresso = Number(sliderProgresso.value);
  const novoStatus = novoProgresso >= 100 ? 'concluído' : 'em andamento';
  const btn = document.getElementById('btn-salvar-progresso');
  const textoOriginal = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    await apiPatch(`/matriculas/${matriculaAtual.id}`, { progresso: novoProgresso, status: novoStatus });
    matriculaAtual = { ...matriculaAtual, progresso: novoProgresso, status: novoStatus };
    renderizarAreaAluno();
    Swal.fire({
      icon: 'success',
      title: novoStatus === 'concluído' ? 'Curso concluído!' : 'Progresso atualizado!',
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível salvar seu progresso.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
});

document.getElementById('btn-matricular').addEventListener('click', async () => {
  const btn = document.getElementById('btn-matricular');
  btn.disabled = true;
  try {
    matriculaAtual = await apiPost('/matriculas', {
      usuarioId: usuarioLogado.id,
      cursoId,
      dataMatricula: new Date().toISOString(),
      progresso: 0,
      status: 'em andamento',
    });
    renderizarAreaAluno();
    Swal.fire('Matrícula realizada!', `Você já pode acompanhar "${cursoAtual.titulo}".`, 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível concluir a matrícula.', 'error');
  } finally {
    btn.disabled = false;
  }
});

// --------------------------------------------------------
// AVALIAÇÃO — só disponível com matrícula concluída; no
// máximo uma avaliação por usuário/curso.
// --------------------------------------------------------
function montarEstrelas() {
  const container = document.getElementById('estrelas-avaliacao');
  container.innerHTML = [1, 2, 3, 4, 5]
    .map((n) => `<button type="button" class="estrela-avaliacao" data-nota="${n}" aria-label="${n} estrela${n > 1 ? 's' : ''}"><i class="fa-regular fa-star"></i></button>`)
    .join('');

  container.querySelectorAll('.estrela-avaliacao').forEach((btn) => {
    btn.addEventListener('click', () => {
      notaSelecionada = Number(btn.dataset.nota);
      document.getElementById('avaliacao-nota').value = notaSelecionada;
      atualizarEstrelasVisual();
    });
  });
}

function atualizarEstrelasVisual() {
  document.querySelectorAll('.estrela-avaliacao').forEach((btn) => {
    const preenchida = Number(btn.dataset.nota) <= notaSelecionada;
    btn.innerHTML = preenchida ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
    btn.classList.toggle('text-amber-400', preenchida);
    btn.classList.toggle('text-neutral-300', !preenchida);
  });
}

function renderizarAvaliacao() {
  const existenteEl = document.getElementById('avaliacao-existente');
  const formEl = document.getElementById('form-avaliacao');

  if (avaliacaoAtual) {
    existenteEl.classList.remove('hidden');
    formEl.classList.add('hidden');
    const estrelas = '★'.repeat(avaliacaoAtual.nota) + '☆'.repeat(5 - avaliacaoAtual.nota);
    existenteEl.innerHTML = `
      <p class="text-amber-400 text-xl mb-1">${estrelas}</p>
      ${avaliacaoAtual.comentario ? `<p class="text-sm text-neutral-600">"${avaliacaoAtual.comentario}"</p>` : ''}
      <p class="text-xs text-neutral-400 mt-2">Obrigado pela sua avaliação!</p>
    `;
    return;
  }

  existenteEl.classList.add('hidden');
  formEl.classList.remove('hidden');
  montarEstrelas();
}

document.getElementById('form-avaliacao').addEventListener('submit', async (event) => {
  event.preventDefault();

  const erroEl = document.querySelector('[data-error-for="avaliacao-nota"]');
  erroEl.textContent = '';

  if (!notaSelecionada) {
    erroEl.textContent = 'Selecione uma nota de 1 a 5 estrelas.';
    return;
  }

  const comentario = document.getElementById('avaliacao-comentario').value.trim().slice(0, 500);
  const btn = document.getElementById('btn-enviar-avaliacao');
  const btnText = document.getElementById('btn-enviar-avaliacao-text');
  const spinner = btn.querySelector('.spinner');

  btn.disabled = true;
  btnText.textContent = 'Enviando...';
  spinner.classList.remove('hidden');

  try {
    avaliacaoAtual = await apiPost('/avaliacoes', {
      usuarioId: usuarioLogado.id,
      cursoId,
      nota: notaSelecionada,
      comentario,
      data: new Date().toISOString(),
    });
    renderizarAvaliacao();
    Swal.fire('Obrigado!', 'Sua avaliação foi registrada.', 'success');
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível registrar sua avaliação.', 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Enviar avaliação';
    spinner.classList.add('hidden');
  }
});
