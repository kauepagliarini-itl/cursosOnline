// relatorios.js — módulo de renderização do relatório administrativo.
// Não é mais uma página própria: vive dentro do Painel do administrador.
// dashboard.js injeta o HTML (relatoriosSecaoHtml/relatoriosModaisHtml)
// e chama inicializarRelatorios() quando o usuário logado é admin.

const STATUS_CURSO_LABELS = { rascunho: 'Rascunho', publicado: 'Publicado' };
const STATUS_MATRICULA_LABELS = { 'em andamento': 'Em andamento', 'concluído': 'Concluído' };

let dadosRelatorio = { usuarios: [], cursos: [], categorias: [], matriculas: [], avaliacoes: [] };

function formatarDataHoraBrasilia(data) {
  return `${new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)} (horário de Brasília)`;
}

function pct(valor, total) {
  return total ? Math.round((valor / total) * 100) : 0;
}

// Conta de 0 até o valor final com easing — dá vida aos cards de resumo
// em vez de só estampar o número. Reaproveitado pelo painel do aluno.
function animarContador(el, valorFinal, duracao = 700) {
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const facilitado = 1 - Math.pow(1 - progresso, 3);
    el.textContent = Math.round(valorFinal * facilitado);
    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

// Barras de proporção (label + contagem + %) reaproveitadas nos cards da
// página, no modal de detalhe e no painel do aluno. Renderiza a largura
// zerada e marca `.barra-animada` para animarBarras() preencher depois.
function barrasHtml(itens) {
  if (!itens.length) {
    return '<p class="text-sm text-neutral-400">Nenhum dado disponível.</p>';
  }

  const total = itens.reduce((soma, item) => soma + item.valor, 0);

  return itens
    .map((item) => {
      const percentual = pct(item.valor, total);
      return `
        <div>
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="text-neutral-600">${item.label}</span>
            <span class="text-neutral-800 font-medium">${item.valor} <span class="text-neutral-400 font-normal">(${percentual}%)</span></span>
          </div>
          <div class="strength-bar-track">
            <div class="strength-bar-fill barra-animada" data-largura="${percentual}" style="width:0%;background-color:${item.cor}"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function animarBarras(container) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.barra-animada').forEach((el) => {
        el.style.width = `${el.dataset.largura}%`;
      });
    });
  });
}

function blocoInsight(texto, icone = 'fa-lightbulb') {
  return `
    <div class="flex gap-2.5 bg-accent-50 border border-accent-100 rounded-lg p-3.5 text-sm text-accent-dark">
      <i class="fa-solid ${icone} mt-0.5"></i>
      <span>${texto}</span>
    </div>
  `;
}

function blocoResumoGrid(itens) {
  return `
    <div class="grid grid-cols-2 gap-3">
      ${itens
        .map(
          (i) => `
        <div class="bg-neutral-50 rounded-lg p-3">
          <p class="text-xl font-semibold text-neutral-800">${i.valor}</p>
          <p class="text-xs text-neutral-500">${i.label}</p>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function nomeCategoriaRelatorio(categoriaId) {
  return dadosRelatorio.categorias.find((c) => c.id === categoriaId)?.nome || '—';
}

// --------------------------------------------------------
// HTML da seção (injetada em #relatorios-secao pelo dashboard.js)
// --------------------------------------------------------
function relatoriosSecaoHtml() {
  return `
    <div class="flex items-start justify-between gap-4 flex-wrap mb-1">
      <h2 class="text-xl font-semibold text-neutral-800">Relatórios</h2>
      <div class="flex gap-3">
        <div class="relative" id="extrair-menu-root">
          <button id="btn-extrair-relatorio" type="button" class="inline-flex items-center gap-2 text-sm font-medium text-accent border border-accent/40 rounded-lg px-4 py-2.5 hover:bg-accent/5 transition-colors" aria-haspopup="true" aria-expanded="false">
            <i class="fa-solid fa-file-arrow-down"></i> Extrair Relatório <i class="fa-solid fa-chevron-down text-xs ml-0.5"></i>
          </button>
          <div id="extrair-dropdown" class="hidden export-dropdown">
            <button type="button" class="avatar-dropdown-item" data-formato="xlsx">
              <i class="fa-solid fa-file-excel" style="color:#1D6F42"></i> Planilha Excel (.xlsx)
            </button>
            <button type="button" class="avatar-dropdown-item" data-formato="csv">
              <i class="fa-solid fa-file-csv" style="color:#22C55E"></i> CSV
            </button>
            <button type="button" class="avatar-dropdown-item" data-formato="xml">
              <i class="fa-solid fa-file-code" style="color:#4C5FBF"></i> XML
            </button>
          </div>
        </div>
        <button id="btn-enviar-email" type="button" class="submit-btn w-auto px-5">
          <i class="fa-solid fa-envelope mr-2"></i> Enviar por E-mail
        </button>
      </div>
    </div>
    <p class="text-neutral-500 text-sm mb-8">Gerado em <span id="relatorio-data-geracao">—</span></p>

    <div id="relatorio-stats-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4"></div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <button type="button" class="detalhe-card text-left w-full bg-white rounded-xl border border-neutral-200 p-5" data-metrica="usuarios-por-perfil">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-neutral-800">Usuários por perfil</h3>
          <span class="text-xs text-accent font-medium whitespace-nowrap">Detalhes <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
        </div>
        <div id="relatorio-usuarios-por-perfil" class="space-y-3"></div>
      </button>
      <button type="button" class="detalhe-card text-left w-full bg-white rounded-xl border border-neutral-200 p-5" data-metrica="cursos-por-status">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-neutral-800">Cursos por status</h3>
          <span class="text-xs text-accent font-medium whitespace-nowrap">Detalhes <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
        </div>
        <div id="relatorio-cursos-por-status" class="space-y-3"></div>
      </button>
      <button type="button" class="detalhe-card text-left w-full bg-white rounded-xl border border-neutral-200 p-5" data-metrica="cursos-por-categoria">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-neutral-800">Cursos por categoria</h3>
          <span class="text-xs text-accent font-medium whitespace-nowrap">Detalhes <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
        </div>
        <div id="relatorio-cursos-por-categoria" class="space-y-3"></div>
      </button>
      <button type="button" class="detalhe-card text-left w-full bg-white rounded-xl border border-neutral-200 p-5" data-metrica="matriculas-por-status">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-neutral-800">Matrículas por status</h3>
          <span class="text-xs text-accent font-medium whitespace-nowrap">Detalhes <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
        </div>
        <div id="relatorio-matriculas-por-status" class="space-y-3"></div>
      </button>
    </div>
  `;
}

function relatoriosModaisHtml() {
  return `
    <div id="modal-detalhe" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
      <div class="bg-white rounded-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-1">
          <div id="detalhe-icone" class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"></div>
          <h2 id="detalhe-titulo" class="text-lg font-semibold text-neutral-800"></h2>
        </div>
        <p id="detalhe-subtitulo" class="text-sm text-neutral-500 mb-5"></p>

        <div id="detalhe-corpo" class="space-y-4"></div>

        <button type="button" id="btn-fechar-detalhe" class="mt-6 w-full rounded-lg border border-neutral-200 text-neutral-600 font-medium py-2.5 hover:bg-neutral-50 transition-colors">
          Fechar
        </button>
      </div>
    </div>

    <div id="modal-email" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
      <div class="bg-white rounded-xl w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-neutral-800 mb-1">Enviar relatório por e-mail</h2>
        <p class="text-sm text-neutral-500 mb-5">Selecione o destinatário cadastrado que vai receber o relatório.</p>

        <form id="form-email">
          <div class="mb-2">
            <label for="email-destinatario" class="block text-sm text-neutral-600 mb-1.5">Destinatário</label>
            <select id="email-destinatario" class="modal-input select-custom"></select>
            <p class="field-error" data-error-for="email-destinatario"></p>
          </div>

          <p class="text-xs text-neutral-400 mb-6 leading-relaxed">
            <i class="fa-solid fa-circle-info mr-1"></i>
            Ambiente de demonstração: como não há um servidor de e-mail real neste projeto, o envio é simulado.
          </p>

          <div class="flex gap-3">
            <button type="button" id="btn-cancelar-email" class="flex-1 rounded-lg border border-neutral-200 text-neutral-600 font-medium py-2.5 hover:bg-neutral-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" id="btn-confirmar-email" class="submit-btn flex-1">
              <span id="btn-confirmar-email-text">Enviar</span>
              <i class="fa-solid fa-circle-notch fa-spin spinner hidden ml-2"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// --------------------------------------------------------
// CARREGAMENTO + RENDERIZAÇÃO
// --------------------------------------------------------
async function inicializarRelatorios() {
  try {
    const [usuarios, cursos, categorias, matriculas, avaliacoes] = await Promise.all([
      apiGet('/usuarios'),
      apiGet('/cursos'),
      apiGet('/categorias'),
      apiGet('/matriculas'),
      apiGet('/avaliacoes'),
    ]);

    dadosRelatorio = { usuarios, cursos, categorias, matriculas, avaliacoes };

    document.getElementById('relatorio-data-geracao').textContent = formatarDataHoraBrasilia(new Date());
    renderizarStatsRelatorio();
    renderizarDetalhamentosRelatorio();
    popularSelectDestinatarios();
    configurarEventosRelatorio();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar os dados do relatório. Verifique se o json-server está em execução.', 'error');
  }
}

function renderizarStatsRelatorio() {
  const stats = [
    { metrica: 'usuarios', icon: 'fa-users', label: 'Usuários', valor: dadosRelatorio.usuarios.length },
    { metrica: 'cursos', icon: 'fa-layer-group', label: 'Cursos', valor: dadosRelatorio.cursos.length },
    { metrica: 'categorias', icon: 'fa-tags', label: 'Categorias', valor: dadosRelatorio.categorias.length },
    { metrica: 'matriculas', icon: 'fa-clipboard-list', label: 'Matrículas', valor: dadosRelatorio.matriculas.length },
    { metrica: 'avaliacoes', icon: 'fa-star', label: 'Avaliações', valor: dadosRelatorio.avaliacoes.length },
  ];

  const statsGrid = document.getElementById('relatorio-stats-grid');
  statsGrid.innerHTML = stats
    .map(
      (s, i) => `
      <button
        type="button"
        class="stat-card bg-white rounded-xl border border-neutral-200 p-5"
        data-metrica="${s.metrica}"
        style="animation-delay:${i * 80}ms"
      >
        <div class="stat-card-icon w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
          <i class="fa-solid ${s.icon}"></i>
        </div>
        <p class="text-2xl font-semibold text-neutral-800" data-contador="${s.valor}">0</p>
        <div class="flex items-center justify-between mt-0.5">
          <p class="text-sm text-neutral-500">${s.label}</p>
          <span class="stat-card-hint text-xs text-accent font-medium whitespace-nowrap">Detalhes <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
        </div>
      </button>
    `
    )
    .join('');

  statsGrid.querySelectorAll('[data-contador]').forEach((el) => {
    animarContador(el, Number(el.dataset.contador));
  });

  statsGrid.querySelectorAll('[data-metrica]').forEach((btn) => {
    btn.addEventListener('click', () => abrirDetalhe(btn.dataset.metrica));
  });
}

function renderizarDetalhamentosRelatorio() {
  const usuariosPorPerfilEl = document.getElementById('relatorio-usuarios-por-perfil');
  usuariosPorPerfilEl.innerHTML = barrasHtml([
    { label: 'Aluno', valor: dadosRelatorio.usuarios.filter((u) => u.role === 'aluno').length, cor: '#8DA0E0' },
    { label: 'Editor', valor: dadosRelatorio.usuarios.filter((u) => u.role === 'editor').length, cor: '#4C5FBF' },
    { label: 'Administrador', valor: dadosRelatorio.usuarios.filter((u) => u.role === 'admin').length, cor: '#3B4A99' },
  ]);
  animarBarras(usuariosPorPerfilEl);

  const cursosPorStatusEl = document.getElementById('relatorio-cursos-por-status');
  cursosPorStatusEl.innerHTML = barrasHtml([
    { label: 'Publicado', valor: dadosRelatorio.cursos.filter((c) => c.status === 'publicado').length, cor: '#22c55e' },
    { label: 'Rascunho', valor: dadosRelatorio.cursos.filter((c) => c.status === 'rascunho').length, cor: '#a3a3a3' },
  ]);
  animarBarras(cursosPorStatusEl);

  const cursosPorCategoriaEl = document.getElementById('relatorio-cursos-por-categoria');
  cursosPorCategoriaEl.innerHTML = barrasHtml(
    dadosRelatorio.categorias.map((cat) => ({
      label: cat.nome,
      valor: dadosRelatorio.cursos.filter((c) => c.categoriaId === cat.id).length,
      cor: '#4C5FBF',
    }))
  );
  animarBarras(cursosPorCategoriaEl);

  const matriculasPorStatusEl = document.getElementById('relatorio-matriculas-por-status');
  matriculasPorStatusEl.innerHTML = barrasHtml([
    { label: 'Em andamento', valor: dadosRelatorio.matriculas.filter((m) => m.status === 'em andamento').length, cor: '#f59e0b' },
    { label: 'Concluído', valor: dadosRelatorio.matriculas.filter((m) => m.status === 'concluído').length, cor: '#22c55e' },
  ]);
  animarBarras(matriculasPorStatusEl);

  document.querySelectorAll('.detalhe-card[data-metrica]').forEach((btn) => {
    btn.addEventListener('click', () => abrirDetalhe(btn.dataset.metrica));
  });
}

// --------------------------------------------------------
// MODAL DE DETALHE — cada métrica (os 5 cards de resumo +
// os 4 quadros de detalhamento) tem sua própria leitura
// contextualizada, não só o número puro.
// --------------------------------------------------------
const DETALHES_METRICA = {
  usuarios() {
    const total = dadosRelatorio.usuarios.length;
    const porRole = ['aluno', 'editor', 'admin'].map((role) => ({
      label: ROLE_LABELS[role],
      valor: dadosRelatorio.usuarios.filter((u) => u.role === role).length,
      cor: { aluno: '#8DA0E0', editor: '#4C5FBF', admin: '#3B4A99' }[role],
    }));
    const ativos = dadosRelatorio.usuarios.filter((u) => u.ativo).length;
    const inativos = total - ativos;

    let insight;
    if (!total) {
      insight = 'Ainda não há usuários cadastrados na plataforma.';
    } else if (inativos > 0) {
      insight = `${inativos} conta${inativos > 1 ? 's' : ''} inativa${inativos > 1 ? 's' : ''} (${pct(inativos, total)}%) — pode valer revisar com o time de suporte.`;
    } else {
      insight = `${pct(porRole[0].valor, total)}% da base são alunos, o público-alvo principal da plataforma. Todas as contas estão ativas.`;
    }

    return {
      icone: 'fa-users',
      titulo: 'Usuários',
      subtitulo: `${total} usuário${total === 1 ? '' : 's'} cadastrado${total === 1 ? '' : 's'} no total`,
      corpo: `
        ${blocoResumoGrid([
          { label: 'Ativos', valor: ativos },
          { label: 'Inativos', valor: inativos },
        ])}
        <div>
          <p class="text-sm font-medium text-neutral-700 mb-2">Distribuição por perfil</p>
          ${barrasHtml(porRole)}
        </div>
        ${blocoInsight(insight)}
      `,
    };
  },

  cursos() {
    const total = dadosRelatorio.cursos.length;
    const publicado = dadosRelatorio.cursos.filter((c) => c.status === 'publicado').length;
    const rascunho = total - publicado;
    const cargaTotal = dadosRelatorio.cursos.reduce((soma, c) => soma + (c.cargaHoraria || 0), 0);
    const cargaMedia = total ? Math.round(cargaTotal / total) : 0;

    let insight;
    if (!total) {
      insight = 'Ainda não há cursos cadastrados.';
    } else if (rascunho > 0) {
      insight = `${rascunho} curso${rascunho > 1 ? 's' : ''} ainda em rascunho — considere revisar e publicar para ampliar o catálogo disponível aos alunos.`;
    } else {
      insight = 'Todos os cursos já estão publicados e disponíveis para matrícula.';
    }

    return {
      icone: 'fa-layer-group',
      titulo: 'Cursos',
      subtitulo: `${total} curso${total === 1 ? '' : 's'} cadastrado${total === 1 ? '' : 's'}, ${cargaTotal}h de conteúdo no total`,
      corpo: `
        ${blocoResumoGrid([
          { label: 'Carga horária total', valor: `${cargaTotal}h` },
          { label: 'Carga horária média', valor: `${cargaMedia}h` },
        ])}
        <div>
          <p class="text-sm font-medium text-neutral-700 mb-2">Status de publicação</p>
          ${barrasHtml([
            { label: 'Publicado', valor: publicado, cor: '#22c55e' },
            { label: 'Rascunho', valor: rascunho, cor: '#a3a3a3' },
          ])}
        </div>
        ${blocoInsight(insight)}
      `,
    };
  },

  categorias() {
    const total = dadosRelatorio.categorias.length;
    const itens = dadosRelatorio.categorias
      .map((cat) => ({ label: cat.nome, valor: dadosRelatorio.cursos.filter((c) => c.categoriaId === cat.id).length, cor: '#4C5FBF' }))
      .sort((a, b) => b.valor - a.valor);
    const semCursos = itens.filter((i) => i.valor === 0);
    const maisForte = itens[0];

    let insight;
    if (!total) {
      insight = 'Nenhuma categoria cadastrada ainda.';
    } else if (maisForte && maisForte.valor > 0) {
      insight = `"${maisForte.label}" concentra o maior número de cursos (${maisForte.valor}).${
        semCursos.length ? ` ${semCursos.length} categoria${semCursos.length > 1 ? 's' : ''} ainda não ${semCursos.length > 1 ? 'têm' : 'tem'} nenhum curso vinculado.` : ''
      }`;
    } else {
      insight = 'Nenhuma categoria possui cursos vinculados ainda.';
    }

    return {
      icone: 'fa-tags',
      titulo: 'Categorias',
      subtitulo: `${total} categoria${total === 1 ? '' : 's'} cadastrada${total === 1 ? '' : 's'}`,
      corpo: `
        <div>
          <p class="text-sm font-medium text-neutral-700 mb-2">Cursos por categoria</p>
          ${barrasHtml(itens)}
        </div>
        ${blocoInsight(insight)}
      `,
    };
  },

  matriculas() {
    const total = dadosRelatorio.matriculas.length;
    const andamento = dadosRelatorio.matriculas.filter((m) => m.status === 'em andamento').length;
    const concluido = total - andamento;
    const progressos = dadosRelatorio.matriculas.map((m) => m.progresso || 0);
    const progressoMedio = progressos.length ? Math.round(progressos.reduce((s, p) => s + p, 0) / progressos.length) : 0;

    const insight = total
      ? `Taxa de conclusão atual: ${pct(concluido, total)}%. Progresso médio das matrículas: ${progressoMedio}%.`
      : 'Ainda não há matrículas registradas — os alunos ainda não se inscreveram em nenhum curso.';

    return {
      icone: 'fa-clipboard-list',
      titulo: 'Matrículas',
      subtitulo: total ? `${total} matrícula${total === 1 ? '' : 's'} registrada${total === 1 ? '' : 's'}` : 'Nenhuma matrícula registrada ainda',
      corpo: `
        <div>
          <p class="text-sm font-medium text-neutral-700 mb-2">Status das matrículas</p>
          ${barrasHtml([
            { label: 'Em andamento', valor: andamento, cor: '#f59e0b' },
            { label: 'Concluído', valor: concluido, cor: '#22c55e' },
          ])}
        </div>
        ${blocoInsight(insight, 'fa-chart-line')}
      `,
    };
  },

  avaliacoes() {
    const total = dadosRelatorio.avaliacoes.length;
    const notas = dadosRelatorio.avaliacoes.map((a) => a.nota);
    const media = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : 0;
    const distribuicao = [5, 4, 3, 2, 1].map((n) => ({
      label: `${n} estrela${n > 1 ? 's' : ''}`,
      valor: notas.filter((x) => x === n).length,
      cor: '#f59e0b',
    }));

    const insight = total ? `Nota média geral: ${media.toFixed(1)} de 5.` : 'Ainda não há avaliações registradas pelos alunos.';

    return {
      icone: 'fa-star',
      titulo: 'Avaliações',
      subtitulo: total ? `${total} avaliação${total === 1 ? '' : 'ões'} registrada${total === 1 ? '' : 's'}` : 'Nenhuma avaliação registrada ainda',
      corpo: `
        <div>
          <p class="text-sm font-medium text-neutral-700 mb-2">Distribuição de notas</p>
          ${barrasHtml(distribuicao)}
        </div>
        ${blocoInsight(insight, 'fa-star-half-stroke')}
      `,
    };
  },

  'usuarios-por-perfil'() {
    const total = dadosRelatorio.usuarios.length;
    const aluno = dadosRelatorio.usuarios.filter((u) => u.role === 'aluno').length;
    const editor = dadosRelatorio.usuarios.filter((u) => u.role === 'editor').length;
    const admin = dadosRelatorio.usuarios.filter((u) => u.role === 'admin').length;
    const razao = editor ? Math.round(aluno / editor) : aluno;

    const insight = total
      ? `Para cada editor, há aproximadamente ${razao} aluno${razao === 1 ? '' : 's'} na plataforma. ${admin} administrador${admin === 1 ? '' : 'es'} com acesso total ao sistema.`
      : 'Nenhum usuário cadastrado ainda.';

    return {
      icone: 'fa-users',
      titulo: 'Usuários por perfil',
      subtitulo: 'Como a base de usuários está distribuída entre os três perfis de acesso',
      corpo: `
        ${barrasHtml([
          { label: 'Aluno', valor: aluno, cor: '#8DA0E0' },
          { label: 'Editor', valor: editor, cor: '#4C5FBF' },
          { label: 'Administrador', valor: admin, cor: '#3B4A99' },
        ])}
        ${blocoInsight(insight, 'fa-scale-balanced')}
      `,
    };
  },

  'cursos-por-status'() {
    const total = dadosRelatorio.cursos.length;
    const publicado = dadosRelatorio.cursos.filter((c) => c.status === 'publicado').length;
    const rascunho = total - publicado;

    const insight = total
      ? rascunho
        ? `${pct(publicado, total)}% do catálogo está publicado. Os ${rascunho} curso${rascunho > 1 ? 's' : ''} em rascunho não aparecem no catálogo público até serem publicados.`
        : 'Todo o catálogo está publicado e visível para os alunos.'
      : 'Nenhum curso cadastrado ainda.';

    return {
      icone: 'fa-layer-group',
      titulo: 'Cursos por status',
      subtitulo: 'Saúde do pipeline de publicação de conteúdo',
      corpo: `
        ${barrasHtml([
          { label: 'Publicado', valor: publicado, cor: '#22c55e' },
          { label: 'Rascunho', valor: rascunho, cor: '#a3a3a3' },
        ])}
        ${blocoInsight(insight, 'fa-eye')}
      `,
    };
  },

  'cursos-por-categoria'() {
    const itens = dadosRelatorio.categorias.map((cat) => ({
      label: cat.nome,
      valor: dadosRelatorio.cursos.filter((c) => c.categoriaId === cat.id).length,
      cor: '#4C5FBF',
    }));
    const semCursos = itens.filter((i) => i.valor === 0).map((i) => i.label);

    const insight = itens.length
      ? semCursos.length
        ? `${semCursos.join(', ')} ainda ${semCursos.length > 1 ? 'não têm' : 'não tem'} cursos — oportunidade de expandir o catálogo nessas áreas.`
        : 'Todas as categorias já possuem ao menos um curso vinculado.'
      : 'Nenhuma categoria cadastrada ainda.';

    return {
      icone: 'fa-tags',
      titulo: 'Cursos por categoria',
      subtitulo: 'Cobertura de conteúdo por área de conhecimento',
      corpo: `
        ${barrasHtml(itens)}
        ${blocoInsight(insight, 'fa-map')}
      `,
    };
  },

  'matriculas-por-status'() {
    const total = dadosRelatorio.matriculas.length;
    const andamento = dadosRelatorio.matriculas.filter((m) => m.status === 'em andamento').length;
    const concluido = total - andamento;

    const insight = total
      ? `Taxa de conclusão: ${pct(concluido, total)}%. ${andamento} matrícula${andamento === 1 ? '' : 's'} ainda em andamento.`
      : 'Ainda não há matrículas para analisar.';

    return {
      icone: 'fa-clipboard-list',
      titulo: 'Matrículas por status',
      subtitulo: 'Engajamento dos alunos com os cursos em que estão matriculados',
      corpo: `
        ${barrasHtml([
          { label: 'Em andamento', valor: andamento, cor: '#f59e0b' },
          { label: 'Concluído', valor: concluido, cor: '#22c55e' },
        ])}
        ${blocoInsight(insight, 'fa-flag-checkered')}
      `,
    };
  },
};

function abrirDetalhe(metrica) {
  const construir = DETALHES_METRICA[metrica];
  if (!construir) return;

  const { icone, titulo, subtitulo, corpo } = construir();
  document.getElementById('detalhe-icone').innerHTML = `<i class="fa-solid ${icone}"></i>`;
  document.getElementById('detalhe-titulo').textContent = titulo;
  document.getElementById('detalhe-subtitulo').textContent = subtitulo;
  const corpoEl = document.getElementById('detalhe-corpo');
  corpoEl.innerHTML = corpo;

  document.getElementById('modal-detalhe').classList.remove('hidden');
  animarBarras(corpoEl);
}

function fecharModalDetalhe() {
  document.getElementById('modal-detalhe').classList.add('hidden');
}

// --------------------------------------------------------
// EXTRAIR RELATÓRIO — em Excel (.xlsx), CSV ou XML, à escolha
// de quem está exportando.
// --------------------------------------------------------

// Estrutura tabular compartilhada pelos três formatos, pra não recalcular
// a mesma coisa três vezes nem deixar os formatos divergirem entre si.
function montarSecoesRelatorio() {
  const resumo = [
    ['Usuários', dadosRelatorio.usuarios.length],
    ['Cursos', dadosRelatorio.cursos.length],
    ['Categorias', dadosRelatorio.categorias.length],
    ['Matrículas', dadosRelatorio.matriculas.length],
    ['Avaliações', dadosRelatorio.avaliacoes.length],
  ];

  const usuariosPorPerfil = ['aluno', 'editor', 'admin'].map((role) => [
    ROLE_LABELS[role],
    dadosRelatorio.usuarios.filter((u) => u.role === role).length,
  ]);

  const cursosPorStatus = Object.entries(STATUS_CURSO_LABELS).map(([status, label]) => [
    label,
    dadosRelatorio.cursos.filter((c) => c.status === status).length,
  ]);

  const cursosPorCategoria = dadosRelatorio.categorias.map((cat) => [
    cat.nome,
    dadosRelatorio.cursos.filter((c) => c.categoriaId === cat.id).length,
  ]);

  const listaCursos = dadosRelatorio.cursos.map((c) => [
    c.titulo,
    nomeCategoriaRelatorio(c.categoriaId),
    dadosRelatorio.usuarios.find((u) => u.id === c.instrutorId)?.nome || '—',
    STATUS_CURSO_LABELS[c.status] || c.status,
    c.cargaHoraria,
  ]);

  const matriculasPorStatus = Object.entries(STATUS_MATRICULA_LABELS).map(([status, label]) => [
    label,
    dadosRelatorio.matriculas.filter((m) => m.status === status).length,
  ]);

  return { resumo, usuariosPorPerfil, cursosPorStatus, cursosPorCategoria, listaCursos, matriculasPorStatus };
}

function dataArquivo() {
  return new Date().toISOString().slice(0, 10);
}

function baixarArquivo(conteudo, nomeArquivo, tipoMime) {
  const blob = new Blob([conteudo], { type: tipoMime });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function baixarRelatorio(formato) {
  if (formato === 'xlsx') return baixarRelatorioXlsx();
  if (formato === 'xml') return baixarRelatorioXml();
  return baixarRelatorioCsv();
}

// ---- CSV ----
function escaparCsv(valor) {
  const texto = String(valor ?? '');
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function linhaCsv(campos) {
  return campos.map(escaparCsv).join(',');
}

function baixarRelatorioCsv() {
  const s = montarSecoesRelatorio();
  const linhas = [];

  linhas.push(linhaCsv(['Relatório - Plataforma de Cursos Online']));
  linhas.push(linhaCsv([`Gerado em: ${formatarDataHoraBrasilia(new Date())}`]));
  linhas.push('');

  linhas.push(linhaCsv(['Resumo Geral']));
  linhas.push(linhaCsv(['Métrica', 'Valor']));
  s.resumo.forEach((linha) => linhas.push(linhaCsv(linha)));
  linhas.push('');

  linhas.push(linhaCsv(['Usuários por Perfil']));
  linhas.push(linhaCsv(['Perfil', 'Quantidade']));
  s.usuariosPorPerfil.forEach((linha) => linhas.push(linhaCsv(linha)));
  linhas.push('');

  linhas.push(linhaCsv(['Cursos por Status']));
  linhas.push(linhaCsv(['Status', 'Quantidade']));
  s.cursosPorStatus.forEach((linha) => linhas.push(linhaCsv(linha)));
  linhas.push('');

  linhas.push(linhaCsv(['Cursos por Categoria']));
  linhas.push(linhaCsv(['Categoria', 'Quantidade']));
  s.cursosPorCategoria.forEach((linha) => linhas.push(linhaCsv(linha)));
  linhas.push('');

  linhas.push(linhaCsv(['Lista de Cursos']));
  linhas.push(linhaCsv(['Título', 'Categoria', 'Instrutor', 'Status', 'Carga Horária (h)']));
  s.listaCursos.forEach((linha) => linhas.push(linhaCsv(linha)));
  linhas.push('');

  linhas.push(linhaCsv(['Matrículas por Status']));
  linhas.push(linhaCsv(['Status', 'Quantidade']));
  s.matriculasPorStatus.forEach((linha) => linhas.push(linhaCsv(linha)));

  // BOM no início: garante que o Excel reconheça a acentuação em UTF-8.
  baixarArquivo('﻿' + linhas.join('\r\n'), `relatorio-eduplat-${dataArquivo()}.csv`, 'text/csv;charset=utf-8');
}

// ---- XML ----
function escaparXml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function baixarRelatorioXml() {
  const s = montarSecoesRelatorio();
  const l = [];

  l.push('<?xml version="1.0" encoding="UTF-8"?>');
  l.push(`<relatorio geradoEm="${escaparXml(formatarDataHoraBrasilia(new Date()))}">`);

  l.push('  <resumoGeral>');
  l.push(`    <usuarios>${dadosRelatorio.usuarios.length}</usuarios>`);
  l.push(`    <cursos>${dadosRelatorio.cursos.length}</cursos>`);
  l.push(`    <categorias>${dadosRelatorio.categorias.length}</categorias>`);
  l.push(`    <matriculas>${dadosRelatorio.matriculas.length}</matriculas>`);
  l.push(`    <avaliacoes>${dadosRelatorio.avaliacoes.length}</avaliacoes>`);
  l.push('  </resumoGeral>');

  l.push('  <usuariosPorPerfil>');
  s.usuariosPorPerfil.forEach(([perfil, qtd]) => l.push(`    <perfil nome="${escaparXml(perfil)}" quantidade="${qtd}"/>`));
  l.push('  </usuariosPorPerfil>');

  l.push('  <cursosPorStatus>');
  s.cursosPorStatus.forEach(([status, qtd]) => l.push(`    <status nome="${escaparXml(status)}" quantidade="${qtd}"/>`));
  l.push('  </cursosPorStatus>');

  l.push('  <cursosPorCategoria>');
  s.cursosPorCategoria.forEach(([categoria, qtd]) => l.push(`    <categoria nome="${escaparXml(categoria)}" quantidade="${qtd}"/>`));
  l.push('  </cursosPorCategoria>');

  l.push('  <cursos>');
  s.listaCursos.forEach(([titulo, categoria, instrutor, status, cargaHoraria]) => {
    l.push(
      `    <curso titulo="${escaparXml(titulo)}" categoria="${escaparXml(categoria)}" instrutor="${escaparXml(instrutor)}" status="${escaparXml(status)}" cargaHoraria="${cargaHoraria}"/>`
    );
  });
  l.push('  </cursos>');

  l.push('  <matriculasPorStatus>');
  s.matriculasPorStatus.forEach(([status, qtd]) => l.push(`    <status nome="${escaparXml(status)}" quantidade="${qtd}"/>`));
  l.push('  </matriculasPorStatus>');

  l.push('</relatorio>');

  baixarArquivo(l.join('\n'), `relatorio-eduplat-${dataArquivo()}.xml`, 'application/xml;charset=utf-8');
}

// ---- Excel (.xlsx) via SheetJS ----
function baixarRelatorioXlsx() {
  if (typeof XLSX === 'undefined') {
    Swal.fire('Erro', 'Não foi possível carregar a biblioteca de Excel. Verifique sua conexão e tente novamente.', 'error');
    return;
  }

  const s = montarSecoesRelatorio();
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Métrica', 'Valor'], ...s.resumo]), 'Resumo Geral');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Perfil', 'Quantidade'], ...s.usuariosPorPerfil]), 'Usuários por Perfil');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Status', 'Quantidade'], ...s.cursosPorStatus]), 'Cursos por Status');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Categoria', 'Quantidade'], ...s.cursosPorCategoria]), 'Cursos por Categoria');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['Título', 'Categoria', 'Instrutor', 'Status', 'Carga Horária (h)'], ...s.listaCursos]),
    'Cursos'
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Status', 'Quantidade'], ...s.matriculasPorStatus]), 'Matrículas por Status');

  XLSX.writeFile(wb, `relatorio-eduplat-${dataArquivo()}.xlsx`);
}

// --------------------------------------------------------
// ENVIAR POR E-MAIL (simulado — não há backend de e-mail
// neste projeto; mesmo padrão já usado na recuperação de senha)
// --------------------------------------------------------
function popularSelectDestinatarios() {
  const select = document.getElementById('email-destinatario');
  select.innerHTML = dadosRelatorio.usuarios.length
    ? `<option value="">Selecione...</option>${dadosRelatorio.usuarios
        .map((u) => `<option value="${u.email}">${u.nome} (${u.email})</option>`)
        .join('')}`
    : '<option value="">Nenhum usuário cadastrado</option>';
}

function abrirModalEmail() {
  const erroEl = document.querySelector('[data-error-for="email-destinatario"]');
  erroEl.textContent = '';
  const select = document.getElementById('email-destinatario');
  select.classList.remove('invalid');
  select.value = '';
  document.getElementById('modal-email').classList.remove('hidden');
}

function fecharModalEmail() {
  document.getElementById('modal-email').classList.add('hidden');
}

async function enviarEmailRelatorio(event) {
  event.preventDefault();

  const select = document.getElementById('email-destinatario');
  const email = select.value;
  const erroEl = document.querySelector('[data-error-for="email-destinatario"]');

  if (!email) {
    select.classList.add('invalid');
    erroEl.textContent = 'Selecione um destinatário.';
    return;
  }
  select.classList.remove('invalid');
  erroEl.textContent = '';

  const destinatario = dadosRelatorio.usuarios.find((u) => u.email === email);
  const btn = document.getElementById('btn-confirmar-email');
  const btnText = document.getElementById('btn-confirmar-email-text');
  const spinner = btn.querySelector('.spinner');

  btn.disabled = true;
  btnText.textContent = 'Enviando...';
  spinner.classList.remove('hidden');

  await new Promise((resolve) => setTimeout(resolve, 800));

  btn.disabled = false;
  btnText.textContent = 'Enviar';
  spinner.classList.add('hidden');
  fecharModalEmail();

  Swal.fire({
    icon: 'success',
    title: 'Relatório enviado!',
    html: `O relatório foi enviado (simulado) para <strong>${destinatario.nome}</strong> &lt;${destinatario.email}&gt;.<br /><span class="text-sm text-neutral-500">Ambiente de demonstração: nenhum e-mail real foi disparado.</span>`,
  });
}

function configurarMenuExportacao() {
  const btn = document.getElementById('btn-extrair-relatorio');
  const dropdown = document.getElementById('extrair-dropdown');

  function fecharMenu() {
    dropdown.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const abrindo = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden', !abrindo);
    btn.setAttribute('aria-expanded', String(abrindo));
  });

  dropdown.querySelectorAll('[data-formato]').forEach((opcao) => {
    opcao.addEventListener('click', () => {
      fecharMenu();
      baixarRelatorio(opcao.dataset.formato);
    });
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target) && event.target !== btn && !btn.contains(event.target)) fecharMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') fecharMenu();
  });
}

function configurarEventosRelatorio() {
  configurarMenuExportacao();
  document.getElementById('btn-enviar-email').addEventListener('click', abrirModalEmail);
  document.getElementById('btn-cancelar-email').addEventListener('click', fecharModalEmail);
  document.getElementById('form-email').addEventListener('submit', enviarEmailRelatorio);

  document.getElementById('btn-fechar-detalhe').addEventListener('click', fecharModalDetalhe);
  const modalDetalhe = document.getElementById('modal-detalhe');
  modalDetalhe.addEventListener('click', (event) => {
    if (event.target === modalDetalhe) fecharModalDetalhe();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modalDetalhe.classList.contains('hidden')) fecharModalDetalhe();
  });
}
