// painel-aluno.js — relatório pessoal exibido no Painel de quem tem role
// "aluno" (no lugar dos cards de gerenciamento, que não fazem sentido para
// esse perfil). Depende de helpers globais já definidos em relatorios.js
// (animarContador, barrasHtml, animarBarras, blocoInsight, blocoResumoGrid) e
// em shell.js (avatarInnerHtml) — por isso ambos precisam ser carregados
// antes deste script.

let dadosAluno = { matriculas: [], cursos: [], categorias: [], avaliacoes: [] };

function painelAlunoSecaoHtml() {
  return `
    <div id="aluno-hero" class="hero-aluno rounded-2xl text-white p-6 sm:p-8 mb-6 relative overflow-hidden">
      <div class="hero-aluno-decor" aria-hidden="true"></div>
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
        <div id="aluno-hero-avatar" class="hero-aluno-avatar flex-shrink-0"></div>
        <div class="min-w-0 flex-1">
          <p id="aluno-hero-contexto" class="text-white/75 text-xs uppercase tracking-wide mb-2"></p>
          <h2 id="aluno-hero-titulo" class="font-display text-xl sm:text-2xl font-semibold mb-2"></h2>
          <p id="aluno-hero-resumo" class="text-white/90 text-sm max-w-2xl leading-relaxed"></p>
        </div>
        <a href="catalogo.html" class="hero-aluno-cta flex-shrink-0 inline-flex items-center justify-center gap-2 bg-white text-accent font-semibold text-sm px-5 py-3 rounded-xl hover:bg-white/90 transition-colors whitespace-nowrap">
          <i class="fa-solid fa-graduation-cap"></i> Fazer Matrícula
        </a>
      </div>
    </div>

    <div id="aluno-stats-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"></div>

    <div class="mb-8">
      <h3 class="font-semibold text-neutral-800 mb-4">Meus cursos</h3>
      <div id="aluno-cursos-lista" class="space-y-3"></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 class="font-semibold text-neutral-800 mb-4"><i class="fa-solid fa-route text-accent mr-1.5"></i>Sugestões para você</h3>
        <div id="aluno-sugestoes" class="space-y-3"></div>
      </div>
      <div>
        <h3 class="font-semibold text-neutral-800 mb-4"><i class="fa-solid fa-graduation-cap text-accent mr-1.5"></i>Dicas de uso da plataforma</h3>
        <div id="aluno-dicas" class="space-y-3"></div>
      </div>
    </div>
  `;
}

function painelAlunoModaisHtml() {
  return `
    <div id="modal-detalhe-aluno" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
      <div class="bg-white rounded-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-1">
          <div id="detalhe-aluno-icone" class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"></div>
          <h2 id="detalhe-aluno-titulo" class="text-lg font-semibold text-neutral-800"></h2>
        </div>
        <p id="detalhe-aluno-subtitulo" class="text-sm text-neutral-500 mb-5"></p>

        <div id="detalhe-aluno-corpo" class="space-y-4"></div>

        <button type="button" id="btn-fechar-detalhe-aluno" class="mt-6 w-full rounded-lg border border-neutral-200 text-neutral-600 font-medium py-2.5 hover:bg-neutral-50 transition-colors">
          Fechar
        </button>
      </div>
    </div>
  `;
}

// Tempo relativo amigável ("há 3 dias", "há 2 meses") a partir de uma data
// ISO — deixa claro o "quando" de cada métrica sem inventar granularidade
// (por hora, por sessão) que este projeto não rastreia de verdade.
function formatarTempoRelativo(dataIso) {
  const diffMs = Date.now() - new Date(dataIso).getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 0) return 'hoje';
  if (diffDias === 1) return 'ontem';
  if (diffDias < 30) return `há ${diffDias} dias`;

  const diffMeses = Math.floor(diffDias / 30);
  if (diffMeses < 12) return `há ${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`;

  const diffAnos = Math.floor(diffMeses / 12);
  return `há ${diffAnos} ${diffAnos === 1 ? 'ano' : 'anos'}`;
}

function formatarDataCurtaBrasilia(dataIso) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dataIso));
}

// Contexto do dia (dia da semana + data) em português — dá o "quando" logo
// no topo do painel, em vez de números soltos sem referência temporal.
function contextoTemporalAtual() {
  const agora = new Date();
  const diaSemana = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' }).format(agora);
  const dataCompleta = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(agora);
  return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} · ${dataCompleta}`;
}

function cursoDoAluno(cursoId) {
  return dadosAluno.cursos.find((c) => c.id === cursoId);
}

function nomeCategoriaAluno(categoriaId) {
  return dadosAluno.categorias.find((c) => c.id === categoriaId)?.nome || '—';
}

async function inicializarPainelAluno(usuario) {
  try {
    const [matriculas, cursos, categorias, avaliacoes] = await Promise.all([
      apiGet(`/matriculas?usuarioId=${usuario.id}`),
      apiGet('/cursos'),
      apiGet('/categorias'),
      apiGet(`/avaliacoes?usuarioId=${usuario.id}`),
    ]);

    dadosAluno = { matriculas, cursos, categorias, avaliacoes };

    renderizarHeroAluno(usuario);
    renderizarStatsAluno();
    renderizarCursosAluno();
    renderizarSugestoesAluno();
    renderizarDicasAluno();
    configurarEventosPainelAluno();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar seus dados. Verifique se o json-server está em execução.', 'error');
  }
}

function renderizarHeroAluno(usuario) {
  const total = dadosAluno.matriculas.length;
  const concluidos = dadosAluno.matriculas.filter((m) => m.status === 'concluído').length;
  const emAndamento = total - concluidos;
  const primeiroNome = usuario.nome.split(' ')[0];

  document.getElementById('aluno-hero-avatar').innerHTML = avatarInnerHtml(usuario);
  document.getElementById('aluno-hero-contexto').textContent = contextoTemporalAtual();

  let titulo;
  let resumo;

  if (!total) {
    titulo = `Olá, ${primeiroNome}! Vamos começar?`;
    resumo = 'Você ainda não está matriculado em nenhum curso. Explore o catálogo e dê o primeiro passo.';
  } else if (concluidos === total) {
    titulo = `Parabéns, ${primeiroNome}!`;
    resumo = `Você concluiu ${concluidos === 1 ? 'o único curso em que se matriculou' : `todos os ${concluidos} cursos em que se matriculou`}. Que tal explorar um novo tema?`;
  } else {
    titulo = `Olá, ${primeiroNome}!`;
    resumo = `Você tem ${emAndamento} curso${emAndamento === 1 ? '' : 's'} em andamento${concluidos ? ` e já concluiu ${concluidos}` : ''}. Continue firme!`;
  }

  document.getElementById('aluno-hero-titulo').textContent = titulo;
  document.getElementById('aluno-hero-resumo').textContent = resumo;
}

function renderizarStatsAluno() {
  const total = dadosAluno.matriculas.length;
  const concluidos = dadosAluno.matriculas.filter((m) => m.status === 'concluído').length;
  const progressos = dadosAluno.matriculas.map((m) => m.progresso || 0);
  const progressoMedio = progressos.length ? Math.round(progressos.reduce((s, p) => s + p, 0) / progressos.length) : 0;
  const notas = dadosAluno.avaliacoes.map((a) => a.nota);
  const notaMedia = notas.length ? (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1) : '—';

  const stats = [
    { metrica: 'matriculados', icon: 'fa-clipboard-list', label: 'Cursos matriculados', valor: total, contador: true, sufixo: '' },
    { metrica: 'concluidos', icon: 'fa-circle-check', label: 'Cursos concluídos', valor: concluidos, contador: true, sufixo: '' },
    { metrica: 'progresso', icon: 'fa-chart-line', label: 'Progresso médio', valor: progressoMedio, contador: true, sufixo: '%' },
    { metrica: 'avaliacoes', icon: 'fa-star', label: 'Nota média que dei', valor: notaMedia, contador: false, sufixo: '' },
  ];

  const grid = document.getElementById('aluno-stats-grid');
  grid.innerHTML = stats
    .map(
      (s, i) => `
      <button
        type="button"
        class="stat-card bg-white rounded-xl border border-neutral-200 p-5"
        data-metrica-aluno="${s.metrica}"
        style="animation-delay:${i * 80}ms"
      >
        <div class="stat-card-icon w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-3">
          <i class="fa-solid ${s.icon}"></i>
        </div>
        <p class="text-2xl font-semibold text-neutral-800">${
          s.contador ? `<span data-contador="${s.valor}">0</span>${s.sufixo}` : `${s.valor}${s.sufixo}`
        }</p>
        <div class="flex items-center justify-between mt-0.5">
          <p class="text-sm text-neutral-500">${s.label}</p>
          <span class="stat-card-hint text-xs text-accent font-medium whitespace-nowrap">Detalhes <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
        </div>
      </button>
    `
    )
    .join('');

  grid.querySelectorAll('[data-contador]').forEach((el) => animarContador(el, Number(el.dataset.contador)));
  grid.querySelectorAll('[data-metrica-aluno]').forEach((btn) => {
    btn.addEventListener('click', () => abrirDetalheStatAluno(btn.dataset.metricaAluno));
  });
}

function renderizarCursosAluno() {
  const container = document.getElementById('aluno-cursos-lista');

  if (!dadosAluno.matriculas.length) {
    container.innerHTML = `
      <div class="bg-white rounded-xl border border-dashed border-neutral-300 p-8 text-center">
        <i class="fa-solid fa-compass text-3xl text-neutral-300 mb-3"></i>
        <p class="text-neutral-500 text-sm mb-4">Você ainda não tem nenhuma matrícula.</p>
        <a href="catalogo.html" class="inline-flex items-center gap-2 text-sm font-medium text-accent border border-accent/40 rounded-lg px-4 py-2 hover:bg-accent/5 transition-colors">
          <i class="fa-solid fa-graduation-cap"></i> Ver Catálogo de Cursos
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = dadosAluno.matriculas
    .map((m, i) => {
      const curso = cursoDoAluno(m.cursoId);
      const progresso = m.progresso || 0;
      const concluido = m.status === 'concluído';

      return `
        <button type="button" class="detalhe-card text-left w-full bg-white rounded-xl border border-neutral-200 p-4 sm:p-5" data-matricula-id="${m.id}" style="animation-delay:${i * 60}ms">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <p class="font-semibold text-neutral-800">${curso ? curso.titulo : 'Curso removido'}</p>
              <p class="text-xs text-neutral-500">
                ${curso ? nomeCategoriaAluno(curso.categoriaId) : ''}${m.dataMatricula ? ` · matriculado ${formatarTempoRelativo(m.dataMatricula)}` : ''}
              </p>
            </div>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${concluido ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
              ${concluido ? 'Concluído' : 'Em andamento'}
            </span>
          </div>
          <div class="strength-bar-track">
            <div class="strength-bar-fill barra-animada" data-largura="${progresso}" style="width:0%;background-color:${concluido ? '#22c55e' : '#4C5FBF'}"></div>
          </div>
          <p class="text-xs text-neutral-400 mt-1">${progresso}% concluído</p>
        </button>
      `;
    })
    .join('');

  animarBarras(container);

  container.querySelectorAll('[data-matricula-id]').forEach((btn) => {
    btn.addEventListener('click', () => abrirDetalheCursoAluno(btn.dataset.matriculaId));
  });
}

function barraProgressoUnica(rotulo, percentual, cor) {
  return `
    <div>
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="text-neutral-600">${rotulo}</span>
        <span class="text-neutral-800 font-medium">${percentual}%</span>
      </div>
      <div class="strength-bar-track">
        <div class="strength-bar-fill barra-animada" data-largura="${percentual}" style="width:0%;background-color:${cor}"></div>
      </div>
    </div>
  `;
}

// Abre o modal genérico de detalhe (reaproveitado pelos cards de resumo e
// pela lista "Meus cursos") já preenchido com o conteúdo montado.
function abrirDetalheAluno({ icone, titulo, subtitulo, corpo }) {
  document.getElementById('detalhe-aluno-icone').innerHTML = `<i class="fa-solid ${icone}"></i>`;
  document.getElementById('detalhe-aluno-titulo').textContent = titulo;
  document.getElementById('detalhe-aluno-subtitulo').textContent = subtitulo;

  const corpoEl = document.getElementById('detalhe-aluno-corpo');
  corpoEl.innerHTML = corpo;

  document.getElementById('modal-detalhe-aluno').classList.remove('hidden');
  animarBarras(corpoEl);
}

function fecharModalDetalheAluno() {
  document.getElementById('modal-detalhe-aluno').classList.add('hidden');
}

function abrirDetalheCursoAluno(matriculaId) {
  const matricula = dadosAluno.matriculas.find((m) => m.id === matriculaId);
  if (!matricula) return;

  const curso = cursoDoAluno(matricula.cursoId);
  const progresso = matricula.progresso || 0;
  const concluido = matricula.status === 'concluído';
  const avaliacao = dadosAluno.avaliacoes.find((a) => a.cursoId === matricula.cursoId);

  let dica;
  if (concluido) {
    dica = avaliacao
      ? `Você já avaliou este curso com nota ${avaliacao.nota}. Obrigado pelo retorno!`
      : 'Você concluiu este curso — que tal deixar uma avaliação para ajudar outros alunos a escolher?';
  } else if (progresso === 0) {
    dica = 'Você ainda não começou este curso. Reserve alguns minutos hoje para dar o primeiro passo.';
  } else if (progresso < 50) {
    dica = 'Você está no começo da jornada. Uma rotina curta e constante rende mais do que sessões longas e espaçadas.';
  } else {
    dica = 'Você já passou da metade! Continue no ritmo — o final está mais perto do que parece.';
  }

  abrirDetalheAluno({
    icone: 'fa-book-open',
    titulo: curso ? curso.titulo : 'Curso removido',
    subtitulo: curso ? nomeCategoriaAluno(curso.categoriaId) : '',
    corpo: `
      ${blocoResumoGrid([
        { label: 'Carga horária', valor: curso ? `${curso.cargaHoraria}h` : '—' },
        { label: 'Status', valor: concluido ? 'Concluído' : 'Em andamento' },
      ])}
      <div>
        <p class="text-sm font-medium text-neutral-700 mb-2">Progresso</p>
        ${barraProgressoUnica('Concluído', progresso, concluido ? '#22c55e' : '#4C5FBF')}
      </div>
      ${
        matricula.dataMatricula
          ? `<p class="text-xs text-neutral-400">Matriculado em ${formatarDataCurtaBrasilia(matricula.dataMatricula)} (${formatarTempoRelativo(matricula.dataMatricula)})</p>`
          : ''
      }
      ${blocoInsight(dica, 'fa-lightbulb')}
    `,
  });
}

// Detalhe de cada card de resumo do topo — mesmo padrão dos cards do
// relatório do admin: número puro + contexto interpretado.
function abrirDetalheStatAluno(metrica) {
  const total = dadosAluno.matriculas.length;
  const concluidas = dadosAluno.matriculas.filter((m) => m.status === 'concluído');
  const emAndamento = dadosAluno.matriculas.filter((m) => m.status !== 'concluído');

  if (metrica === 'matriculados') {
    abrirDetalheAluno({
      icone: 'fa-clipboard-list',
      titulo: 'Cursos matriculados',
      subtitulo: total ? `${total} matrícula${total === 1 ? '' : 's'} no total` : 'Nenhuma matrícula ainda',
      corpo: `
        ${barrasHtml([
          { label: 'Em andamento', valor: emAndamento.length, cor: '#f59e0b' },
          { label: 'Concluído', valor: concluidas.length, cor: '#22c55e' },
        ])}
        ${blocoInsight(
          total
            ? `Você já explorou ${new Set(dadosAluno.matriculas.map((m) => cursoDoAluno(m.cursoId)?.categoriaId)).size} categoria${
                new Set(dadosAluno.matriculas.map((m) => cursoDoAluno(m.cursoId)?.categoriaId)).size === 1 ? '' : 's'
              } diferente${new Set(dadosAluno.matriculas.map((m) => cursoDoAluno(m.cursoId)?.categoriaId)).size === 1 ? '' : 's'} até agora.`
            : 'Assim que você se matricular no primeiro curso, o histórico aparece aqui.',
          'fa-compass'
        )}
      `,
    });
    return;
  }

  if (metrica === 'concluidos') {
    const semAvaliacao = concluidas.filter((m) => !dadosAluno.avaliacoes.some((a) => a.cursoId === m.cursoId));
    abrirDetalheAluno({
      icone: 'fa-circle-check',
      titulo: 'Cursos concluídos',
      subtitulo: concluidas.length ? `${concluidas.length} curso${concluidas.length === 1 ? '' : 's'} concluído${concluidas.length === 1 ? '' : 's'}` : 'Nenhum curso concluído ainda',
      corpo: `
        ${blocoResumoGrid([
          { label: 'Concluídos', valor: concluidas.length },
          { label: 'Sem avaliação', valor: semAvaliacao.length },
        ])}
        ${blocoInsight(
          !concluidas.length
            ? 'Continue nos cursos em andamento — sua primeira conclusão vai aparecer aqui.'
            : semAvaliacao.length
              ? `Você tem ${semAvaliacao.length} curso${semAvaliacao.length === 1 ? '' : 's'} concluído${semAvaliacao.length === 1 ? '' : 's'} sem avaliação. Sua nota ajuda outros alunos a escolher.`
              : 'Você avaliou todos os cursos que concluiu. Obrigado pelo retorno!',
          'fa-star'
        )}
      `,
    });
    return;
  }

  if (metrica === 'progresso') {
    const itens = emAndamento.map((m) => ({
      label: cursoDoAluno(m.cursoId)?.titulo || 'Curso removido',
      valor: m.progresso || 0,
      cor: '#4C5FBF',
    }));
    abrirDetalheAluno({
      icone: 'fa-chart-line',
      titulo: 'Progresso médio',
      subtitulo: emAndamento.length ? `Progresso atual dos seus cursos em andamento` : 'Nenhum curso em andamento no momento',
      corpo: itens.length
        ? itens.map((item) => barraProgressoUnica(item.label, item.valor, item.cor)).join('')
        : blocoInsight('Você não tem cursos em andamento agora. Que tal começar um novo?', 'fa-compass'),
    });
    return;
  }

  if (metrica === 'avaliacoes') {
    const notas = dadosAluno.avaliacoes.map((a) => a.nota);
    const distribuicao = [5, 4, 3, 2, 1].map((n) => ({
      label: `${n} estrela${n > 1 ? 's' : ''}`,
      valor: notas.filter((x) => x === n).length,
      cor: '#f59e0b',
    }));
    abrirDetalheAluno({
      icone: 'fa-star',
      titulo: 'Notas que você deu',
      subtitulo: notas.length ? `${notas.length} avaliação${notas.length === 1 ? '' : 'ões'} registrada${notas.length === 1 ? '' : 's'}` : 'Nenhuma avaliação registrada ainda',
      corpo: `
        ${barrasHtml(distribuicao)}
        ${blocoInsight(
          notas.length
            ? 'Suas avaliações ajudam outros alunos a escolher melhor os próximos cursos.'
            : 'Avalie os cursos que concluir — leva menos de um minuto e ajuda a comunidade.',
          'fa-comment-dots'
        )}
      `,
    });
  }
}

// Sugestões dinâmicas: escolhidas por condição a partir dos dados reais do
// aluno (não é uma lista fixa) — cada uma só aparece se fizer sentido para
// a situação atual dele.
function renderizarSugestoesAluno() {
  const total = dadosAluno.matriculas.length;
  const concluidos = dadosAluno.matriculas.filter((m) => m.status === 'concluído').length;
  const emAndamento = dadosAluno.matriculas.filter((m) => m.status === 'em andamento');
  const semProgresso = emAndamento.filter((m) => (m.progresso || 0) === 0);
  const quaseConcluindo = emAndamento.filter((m) => (m.progresso || 0) >= 70 && (m.progresso || 0) < 100);
  const progressoMedio = emAndamento.length
    ? Math.round(emAndamento.reduce((s, m) => s + (m.progresso || 0), 0) / emAndamento.length)
    : 0;
  const concluidosSemAvaliacao = dadosAluno.matriculas.filter(
    (m) => m.status === 'concluído' && !dadosAluno.avaliacoes.some((a) => a.cursoId === m.cursoId)
  );

  const candidatas = [
    {
      condicao: total === 0,
      icone: 'fa-compass',
      texto: 'Você ainda não se matriculou em nenhum curso. Escolha um tema que desperte curiosidade — o primeiro passo é o que mais importa.',
    },
    {
      condicao: semProgresso.length > 0,
      icone: 'fa-play',
      texto: `Você tem ${semProgresso.length} curso${semProgresso.length > 1 ? 's' : ''} matriculado${semProgresso.length > 1 ? 's' : ''} sem nenhum progresso ainda. Comece hoje, mesmo que só com 15 minutos.`,
    },
    {
      condicao: quaseConcluindo.length > 0,
      icone: 'fa-flag-checkered',
      texto: `Você está a poucos passos de concluir ${quaseConcluindo.length > 1 ? 'alguns cursos' : 'um curso'}! Reserve um tempo essa semana para finalizar.`,
    },
    {
      condicao: emAndamento.length > 1,
      icone: 'fa-list-check',
      texto: `Você tem ${emAndamento.length} cursos em andamento ao mesmo tempo. Focar em um por vez costuma acelerar a conclusão.`,
    },
    {
      condicao: progressoMedio > 0 && progressoMedio < 30,
      icone: 'fa-calendar-check',
      texto: 'Seu progresso está no início. Defina um horário fixo no seu dia — mesmo 20 minutos diários criam consistência.',
    },
    {
      condicao: concluidosSemAvaliacao.length > 0,
      icone: 'fa-star',
      texto: `Você concluiu ${concluidosSemAvaliacao.length} curso${concluidosSemAvaliacao.length > 1 ? 's' : ''} sem avaliar. Sua nota ajuda outros alunos a escolher melhor.`,
    },
    {
      condicao: concluidos > 0 && emAndamento.length === 0,
      icone: 'fa-seedling',
      texto: 'Você concluiu tudo que começou. Que tal explorar uma nova categoria e ampliar seu repertório?',
    },
  ];

  const sugestoes = candidatas.filter((s) => s.condicao).slice(0, 4);

  if (!sugestoes.length) {
    sugestoes.push({ icone: 'fa-thumbs-up', texto: 'Você está com um ritmo saudável de estudos. Continue assim!' });
  }

  document.getElementById('aluno-sugestoes').innerHTML = sugestoes
    .map(
      (s) => `
      <div class="flex gap-2.5 bg-accent-50 border border-accent-100 rounded-lg p-3.5 text-sm text-accent-dark">
        <i class="fa-solid ${s.icone} mt-0.5 flex-shrink-0"></i>
        <span>${s.texto}</span>
      </div>
    `
    )
    .join('');
}

// Dicas gerais de uso da plataforma. O subconjunto exibido muda por dia do
// ano (determinístico, não é aleatório a cada recarregamento) — pra não
// mostrar sempre a mesma lista estática toda vez que o aluno entra.
function renderizarDicasAluno() {
  const todasDicas = [
    { icone: 'fa-magnifying-glass', texto: 'Use os filtros por categoria no catálogo para encontrar cursos do seu interesse mais rápido.' },
    { icone: 'fa-user-pen', texto: 'Mantenha seu perfil atualizado em "Minha Conta" — nome e foto ajudam a personalizar sua experiência.' },
    { icone: 'fa-star', texto: 'Avalie os cursos que concluir. Sua nota e comentário ajudam outros alunos a decidir.' },
    { icone: 'fa-clock', texto: 'Estudar um pouco todos os dias rende mais do que uma sessão longa uma vez por semana.' },
    { icone: 'fa-bullseye', texto: 'Defina uma meta de progresso semanal para cada curso em andamento e acompanhe aqui no seu painel.' },
    { icone: 'fa-layer-group', texto: 'Cursos com carga horária menor são uma boa forma de manter o ritmo entre os módulos mais longos.' },
  ];

  const diaDoAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const inicio = diaDoAno % todasDicas.length;
  const dicas = [0, 1, 2].map((i) => todasDicas[(inicio + i) % todasDicas.length]);

  document.getElementById('aluno-dicas').innerHTML = dicas
    .map(
      (d) => `
      <div class="flex gap-2.5 bg-neutral-50 border border-neutral-200 rounded-lg p-3.5 text-sm text-neutral-600">
        <i class="fa-solid ${d.icone} mt-0.5 flex-shrink-0 text-accent"></i>
        <span>${d.texto}</span>
      </div>
    `
    )
    .join('');
}

function configurarEventosPainelAluno() {
  document.getElementById('btn-fechar-detalhe-aluno').addEventListener('click', fecharModalDetalheAluno);

  const modal = document.getElementById('modal-detalhe-aluno');
  modal.addEventListener('click', (event) => {
    if (event.target === modal) fecharModalDetalheAluno();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) fecharModalDetalheAluno();
  });
}
