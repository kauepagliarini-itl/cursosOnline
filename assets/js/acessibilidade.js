// acessibilidade.js — menu de redes sociais e acessibilidade do navbar
// (daltonismo, leitura facilitada/dislexia, tamanho de fonte, LGPD) + widget
// oficial do VLibras. Carregado em toda página. Os botões que abrem os
// menus (#btn-redes-sociais / #btn-acessibilidade) já vêm prontos dentro
// de um wrapper "position:relative" — em shell.js (telas internas) ou
// direto no cabeçalho de index.html/cadastro.html.

const CHAVE_FONTE = 'acessibilidadeEscalaFonte';
const CHAVE_DALTONISMO = 'acessibilidadeDaltonismo';
const CHAVE_DISLEXIA = 'acessibilidadeDislexia';

const ESCALA_MIN = 0.85;
const ESCALA_MAX = 1.3;
const ESCALA_PASSO = 0.075;

function socialDropdownHtml() {
  return `
    <div id="social-dropdown" class="hidden export-dropdown" style="width:auto; padding:0.75rem 1rem;">
      <div class="flex items-center gap-3">
        <a href="#" aria-label="Facebook" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>
        <a href="#" aria-label="Twitter" class="social-icon"><i class="fa-brands fa-twitter"></i></a>
        <a href="#" aria-label="Instagram" class="social-icon"><i class="fa-brands fa-instagram"></i></a>
        <a href="#" aria-label="YouTube" class="social-icon"><i class="fa-brands fa-youtube"></i></a>
      </div>
    </div>
  `;
}

function acessibilidadePainelHtml() {
  return `
    <div id="painel-acessibilidade" class="hidden acessibilidade-painel">
      <p class="acessibilidade-titulo">Acessibilidade</p>

      <div class="acessibilidade-secao">
        <p class="acessibilidade-label">Tamanho da fonte</p>
        <div class="flex items-center gap-2">
          <button type="button" id="btn-fonte-menos" class="acessibilidade-btn-fonte" aria-label="Diminuir fonte">A-</button>
          <button type="button" id="btn-fonte-reset" class="acessibilidade-btn-fonte acessibilidade-btn-fonte-reset" aria-label="Restaurar fonte">A</button>
          <button type="button" id="btn-fonte-mais" class="acessibilidade-btn-fonte" aria-label="Aumentar fonte">A+</button>
        </div>
      </div>

      <label class="acessibilidade-toggle">
        <input type="checkbox" id="toggle-daltonismo" />
        <span><i class="fa-solid fa-eye mr-1.5"></i>Modo daltonismo</span>
      </label>

      <label class="acessibilidade-toggle">
        <input type="checkbox" id="toggle-dislexia" />
        <span><i class="fa-solid fa-book-open-reader mr-1.5"></i>Leitura facilitada (dislexia)</span>
      </label>

      <button type="button" id="btn-abrir-lgpd" class="acessibilidade-link">
        <i class="fa-solid fa-shield-halved mr-1.5"></i> Privacidade e proteção de dados (LGPD)
      </button>

      <p class="acessibilidade-vlibras-info"><i class="fa-solid fa-hands mr-1.5"></i>Tradução em Libras disponível pelo ícone azul no canto da tela.</p>
    </div>
  `;
}

function lgpdModalHtml() {
  return `
    <div id="modal-lgpd" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
      <div class="bg-white rounded-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h2 class="text-lg font-semibold text-neutral-800">Privacidade e Proteção de Dados (LGPD)</h2>
        </div>

        <div class="text-sm text-neutral-600 space-y-3 leading-relaxed">
          <p>A EduPlat trata os dados pessoais dos usuários em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
          <p><strong class="text-neutral-800">Quais dados coletamos:</strong> nome, e-mail e senha no cadastro; dados de matrícula e progresso nos cursos; avaliações e comentários enviados voluntariamente.</p>
          <p><strong class="text-neutral-800">Finalidade:</strong> esses dados são usados exclusivamente para viabilizar o funcionamento da plataforma — autenticação, acompanhamento de progresso e emissão de relatórios internos.</p>
          <p><strong class="text-neutral-800">Seus direitos:</strong> você pode solicitar a qualquer momento a correção, atualização ou exclusão dos seus dados através da tela "Minha Conta" ou entrando em contato com a administração.</p>
          <p><strong class="text-neutral-800">Cookies:</strong> utilizamos armazenamento local do navegador (localStorage) para manter sua sessão e preferências de acessibilidade — não compartilhamos esses dados com terceiros.</p>
          <p class="text-xs text-neutral-400">Este é um ambiente de demonstração acadêmica; nenhum dado é compartilhado com terceiros ou usado para fins comerciais.</p>
        </div>

        <button type="button" id="btn-fechar-lgpd" class="mt-6 w-full rounded-lg border border-neutral-200 text-neutral-600 font-medium py-2.5 hover:bg-neutral-50 transition-colors">
          Fechar
        </button>
      </div>
    </div>
  `;
}

function injetarPaineis() {
  const socialRoot = document.getElementById('social-menu-root');
  if (socialRoot) socialRoot.insertAdjacentHTML('beforeend', socialDropdownHtml());

  const acessibilidadeRoot = document.getElementById('acessibilidade-menu-root');
  if (acessibilidadeRoot) acessibilidadeRoot.insertAdjacentHTML('beforeend', acessibilidadePainelHtml());

  document.body.insertAdjacentHTML('beforeend', lgpdModalHtml());
}

function lerEscalaFonteSalva() {
  const valor = parseFloat(localStorage.getItem(CHAVE_FONTE));
  return Number.isFinite(valor) ? valor : 1;
}

function aplicarEscalaFonte(escala) {
  const escalaLimitada = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escala));
  document.documentElement.style.setProperty('--escala-fonte', escalaLimitada);
  localStorage.setItem(CHAVE_FONTE, escalaLimitada);
}

function aplicarPreferenciasSalvas() {
  aplicarEscalaFonte(lerEscalaFonteSalva());

  const daltonismoAtivo = localStorage.getItem(CHAVE_DALTONISMO) === '1';
  document.documentElement.classList.toggle('modo-daltonismo', daltonismoAtivo);
  const toggleDaltonismo = document.getElementById('toggle-daltonismo');
  if (toggleDaltonismo) toggleDaltonismo.checked = daltonismoAtivo;

  const dislexiaAtiva = localStorage.getItem(CHAVE_DISLEXIA) === '1';
  document.documentElement.classList.toggle('modo-dislexia', dislexiaAtiva);
  const toggleDislexia = document.getElementById('toggle-dislexia');
  if (toggleDislexia) toggleDislexia.checked = dislexiaAtiva;
}

function alternarDropdown(dropdown, botao) {
  if (!dropdown || !botao) return;
  const abrindo = dropdown.classList.contains('hidden');
  fecharTodosOsMenus();
  dropdown.classList.toggle('hidden', !abrindo);
  botao.setAttribute('aria-expanded', String(abrindo));
}

function fecharTodosOsMenus() {
  document.querySelectorAll('#social-dropdown, #painel-acessibilidade').forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('#btn-redes-sociais, #btn-acessibilidade').forEach((el) => el.setAttribute('aria-expanded', 'false'));
}

function configurarEventos() {
  const btnSocial = document.getElementById('btn-redes-sociais');
  const socialDropdown = document.getElementById('social-dropdown');
  if (btnSocial && socialDropdown) {
    btnSocial.addEventListener('click', (event) => {
      event.stopPropagation();
      alternarDropdown(socialDropdown, btnSocial);
    });
  }

  const btnAcessibilidade = document.getElementById('btn-acessibilidade');
  const painelAcessibilidade = document.getElementById('painel-acessibilidade');
  if (btnAcessibilidade && painelAcessibilidade) {
    btnAcessibilidade.addEventListener('click', (event) => {
      event.stopPropagation();
      alternarDropdown(painelAcessibilidade, btnAcessibilidade);
    });
  }

  document.addEventListener('click', (event) => {
    if (
      !event.target.closest('#social-menu-root') &&
      !event.target.closest('#acessibilidade-menu-root')
    ) {
      fecharTodosOsMenus();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') fecharTodosOsMenus();
  });

  const btnFonteMais = document.getElementById('btn-fonte-mais');
  const btnFonteMenos = document.getElementById('btn-fonte-menos');
  const btnFonteReset = document.getElementById('btn-fonte-reset');
  if (btnFonteMais) btnFonteMais.addEventListener('click', () => aplicarEscalaFonte(lerEscalaFonteSalva() + ESCALA_PASSO));
  if (btnFonteMenos) btnFonteMenos.addEventListener('click', () => aplicarEscalaFonte(lerEscalaFonteSalva() - ESCALA_PASSO));
  if (btnFonteReset) btnFonteReset.addEventListener('click', () => aplicarEscalaFonte(1));

  const toggleDaltonismo = document.getElementById('toggle-daltonismo');
  if (toggleDaltonismo) {
    toggleDaltonismo.addEventListener('change', () => {
      document.documentElement.classList.toggle('modo-daltonismo', toggleDaltonismo.checked);
      localStorage.setItem(CHAVE_DALTONISMO, toggleDaltonismo.checked ? '1' : '0');
    });
  }

  const toggleDislexia = document.getElementById('toggle-dislexia');
  if (toggleDislexia) {
    toggleDislexia.addEventListener('change', () => {
      document.documentElement.classList.toggle('modo-dislexia', toggleDislexia.checked);
      localStorage.setItem(CHAVE_DISLEXIA, toggleDislexia.checked ? '1' : '0');
    });
  }

  const modalLgpd = document.getElementById('modal-lgpd');
  const btnAbrirLgpd = document.getElementById('btn-abrir-lgpd');
  const btnFecharLgpd = document.getElementById('btn-fechar-lgpd');
  if (btnAbrirLgpd) {
    btnAbrirLgpd.addEventListener('click', () => {
      fecharTodosOsMenus();
      modalLgpd.classList.remove('hidden');
    });
  }
  if (btnFecharLgpd) btnFecharLgpd.addEventListener('click', () => modalLgpd.classList.add('hidden'));
  if (modalLgpd) {
    modalLgpd.addEventListener('click', (event) => {
      if (event.target === modalLgpd) modalLgpd.classList.add('hidden');
    });
  }
}

// Widget oficial do governo federal (vlibras.gov.br) — tradução em Libras.
// Autoexibe seu próprio botão flutuante, sem precisar de UI própria aqui.
function injetarVLibras() {
  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div vw class="enabled">
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    </div>
  `
  );

  const script = document.createElement('script');
  script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  script.onload = () => {
    if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');
  };
  document.body.appendChild(script);
}

injetarPaineis();
aplicarPreferenciasSalvas();
configurarEventos();
injetarVLibras();
