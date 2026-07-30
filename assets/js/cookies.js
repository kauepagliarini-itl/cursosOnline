// cookies.js — aviso de consentimento de cookies (LGPD), exibido uma única
// vez até a pessoa escolher aceitar ou recusar. Guardado em localStorage.

const CHAVE_COOKIES = 'consentimentoCookies';

function precisaMostrarAvisoCookies() {
  return !localStorage.getItem(CHAVE_COOKIES);
}

function avisoCookiesHtml() {
  return `
    <div id="aviso-cookies" class="cookie-banner">
      <div class="cookie-banner-inner">
        <p class="cookie-banner-texto">
          <i class="fa-solid fa-cookie-bite mr-1.5"></i>
          Usamos armazenamento local (cookies/localStorage) para manter sua sessão e suas preferências de acessibilidade,
          em conformidade com a LGPD. Você aceita?
        </p>
        <div class="cookie-banner-acoes">
          <button type="button" id="btn-cookies-recusar" class="cookie-banner-btn cookie-banner-btn-secundario">Recusar</button>
          <button type="button" id="btn-cookies-aceitar" class="cookie-banner-btn cookie-banner-btn-primario">Aceitar</button>
        </div>
      </div>
    </div>
  `;
}

function inicializarAvisoCookies() {
  if (!precisaMostrarAvisoCookies()) return;

  document.body.insertAdjacentHTML('beforeend', avisoCookiesHtml());
  const aviso = document.getElementById('aviso-cookies');

  function responder(valor) {
    localStorage.setItem(CHAVE_COOKIES, valor);
    aviso.remove();
  }

  document.getElementById('btn-cookies-aceitar').addEventListener('click', () => responder('aceito'));
  document.getElementById('btn-cookies-recusar').addEventListener('click', () => responder('recusado'));
}

inicializarAvisoCookies();
