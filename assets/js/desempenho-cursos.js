initVantaBackground('.admin-bg');

const STATUS_MATRICULA_LABELS_DESEMPENHO = { 'em andamento': 'Em andamento', 'concluído': 'Concluído' };

const usuarioLogado = exigirRole(['editor', 'admin']);
const cursoId = new URLSearchParams(window.location.search).get('cursoId');

if (usuarioLogado) {
  renderAppShell('cursos');
  if (!cursoId) {
    Swal.fire('Curso não especificado', 'Volte para "Gerenciar Cursos" e escolha um curso primeiro.', 'error').then(() => {
      window.location.href = '/html/cursos.html';
    });
  } else {
    carregarDesempenho();
  }
}

function nomeUsuario(usuarios, usuarioId) {
  return usuarios.find((u) => u.id === usuarioId)?.nome || '—';
}

function formatarDataCurta(dataIso) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(dataIso)
  );
}

async function carregarDesempenho() {
  try {
    const curso = await apiGet(`/cursos/${cursoId}`);

    // Editor só pode ver o desempenho dos cursos em que é o instrutor;
    // admin herda a permissão e vê qualquer curso.
    if (usuarioLogado.role === 'editor' && curso.instrutorId !== usuarioLogado.id) {
      await Swal.fire('Acesso restrito', 'Você só pode ver o desempenho dos cursos em que é o instrutor.', 'error');
      window.location.href = '/html/cursos.html';
      return;
    }

    const [usuarios, matriculas, avaliacoes] = await Promise.all([
      apiGet('/usuarios'),
      apiGet(`/matriculas?cursoId=${cursoId}`),
      apiGet(`/avaliacoes?cursoId=${cursoId}`),
    ]);

    document.title = `Desempenho de ${curso.titulo} | Plataforma de Cursos Online`;
    document.getElementById('curso-titulo-contexto').textContent = curso.titulo;

    renderizarStats(matriculas, avaliacoes);
    renderizarMatriculas(matriculas, usuarios);
    renderizarAvaliacoes(avaliacoes, usuarios);
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar o desempenho do curso. Verifique se o json-server está em execução.', 'error');
  }
}

function renderizarStats(matriculas, avaliacoes) {
  const total = matriculas.length;
  const concluidas = matriculas.filter((m) => m.status === 'concluído').length;
  const progressoMedio = total ? Math.round(matriculas.reduce((s, m) => s + (m.progresso || 0), 0) / total) : 0;
  const notas = avaliacoes.map((a) => a.nota);
  const notaMedia = notas.length ? (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1) : '—';

  const stats = [
    { icon: 'fa-clipboard-list', label: 'Matrículas', valor: total, contador: true },
    { icon: 'fa-circle-check', label: 'Concluídas', valor: concluidas, contador: true },
    { icon: 'fa-chart-line', label: 'Progresso médio', valor: `${progressoMedio}%`, contador: false },
    { icon: 'fa-star', label: 'Nota média', valor: notaMedia, contador: false },
  ];

  const grid = document.getElementById('stats-grid');
  grid.innerHTML = stats
    .map(
      (s, i) => `
      <div class="stat-card-static bg-white rounded-xl border border-neutral-200 p-5" style="animation-delay:${i * 80}ms">
        <div class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
          <i class="fa-solid ${s.icon}"></i>
        </div>
        <p class="text-2xl font-semibold text-neutral-800" ${s.contador ? `data-contador="${s.valor}"` : ''}>${s.contador ? '0' : s.valor}</p>
        <p class="text-sm text-neutral-500">${s.label}</p>
      </div>
    `
    )
    .join('');

  grid.querySelectorAll('[data-contador]').forEach((el) => animarContador(el, Number(el.dataset.contador)));
}

function renderizarMatriculas(matriculas, usuarios) {
  const tabela = document.getElementById('tabela-matriculas');
  document.getElementById('matriculas-vazio').classList.toggle('hidden', matriculas.length > 0);

  tabela.innerHTML = matriculas
    .map((m) => {
      const concluido = m.status === 'concluído';
      return `
        <tr>
          <td class="px-5 py-3"><span class="font-semibold text-neutral-800">${nomeUsuario(usuarios, m.usuarioId)}</span></td>
          <td class="px-5 py-3">
            <span class="text-xs font-medium px-2.5 py-1 rounded-full ${concluido ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
              ${STATUS_MATRICULA_LABELS_DESEMPENHO[m.status] || m.status}
            </span>
          </td>
          <td class="px-5 py-3 text-neutral-500">${m.progresso || 0}%</td>
          <td class="px-5 py-3 text-neutral-500">${m.dataMatricula ? formatarDataCurta(m.dataMatricula) : '—'}</td>
        </tr>
      `;
    })
    .join('');
}

function renderizarAvaliacoes(avaliacoes, usuarios) {
  const container = document.getElementById('lista-avaliacoes');
  document.getElementById('avaliacoes-vazio').classList.toggle('hidden', avaliacoes.length > 0);

  container.innerHTML = avaliacoes
    .map((a) => {
      const estrelas = '★'.repeat(a.nota) + '☆'.repeat(5 - a.nota);
      return `
        <div class="bg-white rounded-xl border border-neutral-200 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-neutral-800 text-sm">${nomeUsuario(usuarios, a.usuarioId)}</span>
            <span class="text-amber-400 text-sm">${estrelas}</span>
          </div>
          ${a.comentario ? `<p class="text-sm text-neutral-600">"${a.comentario}"</p>` : ''}
          ${a.data ? `<p class="text-xs text-neutral-400 mt-1">${formatarDataCurta(a.data)}</p>` : ''}
        </div>
      `;
    })
    .join('');
}
