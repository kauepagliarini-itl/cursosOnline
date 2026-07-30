initVantaBackground('.admin-bg');

const ACAO_LABELS = { download: 'Extraiu arquivo', email: 'Enviou por e-mail' };
const FORMATO_LABELS = { xlsx: 'Excel (.xlsx)', csv: 'CSV', xml: 'XML' };

const usuarioLogado = exigirRole(['admin']);

let listaLogs = [];
let listaFiltrada = [];
let paginaAtual = 1;
let itensPorPagina = 10;

if (usuarioLogado) {
  renderAppShell('relatorios-logs');
  carregarLogs();
}

const tabela = document.getElementById('tabela-logs');
const estadoVazio = document.getElementById('estado-vazio');

const filtroBusca = document.getElementById('filtro-busca');
const filtroAcao = document.getElementById('filtro-acao');
const filtroFormato = document.getElementById('filtro-formato');

const itensPorPaginaSelect = document.getElementById('itens-por-pagina');
const paginacaoInfo = document.getElementById('paginacao-info');
const btnPaginaAnterior = document.getElementById('btn-pagina-anterior');
const btnPaginaProxima = document.getElementById('btn-pagina-proxima');

async function carregarLogs() {
  try {
    const logs = await apiGet('/logsRelatorios');
    // mais recente primeiro
    listaLogs = logs.slice().sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    aplicarFiltros();
  } catch (err) {
    Swal.fire('Erro', 'Não foi possível carregar o histórico. Verifique se o json-server está em execução.', 'error');
  }
}

function formatarDataHoraLog(dataIso) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dataIso));
}

function aplicarFiltros() {
  const termo = filtroBusca.value.trim().toLowerCase();
  const acao = filtroAcao.value;
  const formato = filtroFormato.value;

  listaFiltrada = listaLogs.filter((log) => {
    const combinaTermo = !termo || (log.usuarioNome || '').toLowerCase().includes(termo);
    const combinaAcao = !acao || log.acao === acao;
    const combinaFormato = !formato || log.formato === formato;
    return combinaTermo && combinaAcao && combinaFormato;
  });

  paginaAtual = 1;
  renderizarLogs();
}

function renderizarLogs() {
  const totalItens = listaFiltrada.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  paginaAtual = Math.min(Math.max(paginaAtual, 1), totalPaginas);

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const paginaDeLogs = listaFiltrada.slice(inicio, inicio + itensPorPagina);

  tabela.innerHTML = '';
  estadoVazio.classList.toggle('hidden', totalItens > 0);

  paginaDeLogs.forEach((log) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="px-5 py-3"><span class="font-semibold text-neutral-800">${log.usuarioNome || '—'}</span></td>
      <td class="px-5 py-3">
        <span class="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
          log.acao === 'email' ? 'bg-accent-50 text-accent-dark' : 'bg-emerald-100 text-emerald-700'
        }">
          <i class="fa-solid ${log.acao === 'email' ? 'fa-envelope' : 'fa-file-arrow-down'} mr-1"></i>
          ${ACAO_LABELS[log.acao] || log.acao}
        </span>
      </td>
      <td class="px-5 py-3 text-neutral-500">${log.formato ? FORMATO_LABELS[log.formato] || log.formato : '—'}</td>
      <td class="px-5 py-3 text-neutral-500">${log.destinatarioEmail || '—'}</td>
      <td class="px-5 py-3 text-neutral-500 whitespace-nowrap">${formatarDataHoraLog(log.dataHora)}</td>
    `;

    tabela.appendChild(tr);
  });

  const fim = totalItens === 0 ? 0 : Math.min(inicio + itensPorPagina, totalItens);
  paginacaoInfo.textContent = totalItens === 0 ? 'Nenhum resultado' : `${inicio + 1}–${fim} de ${totalItens}`;
  btnPaginaAnterior.disabled = paginaAtual <= 1;
  btnPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

filtroBusca.addEventListener('input', aplicarFiltros);
filtroAcao.addEventListener('change', aplicarFiltros);
filtroFormato.addEventListener('change', aplicarFiltros);

itensPorPaginaSelect.addEventListener('change', () => {
  itensPorPagina = parseInt(itensPorPaginaSelect.value, 10);
  paginaAtual = 1;
  renderizarLogs();
});

btnPaginaAnterior.addEventListener('click', () => {
  paginaAtual--;
  renderizarLogs();
});

btnPaginaProxima.addEventListener('click', () => {
  paginaAtual++;
  renderizarLogs();
});
