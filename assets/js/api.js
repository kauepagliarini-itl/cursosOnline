const API_URL = 'http://localhost:3000';

// Abrir os arquivos direto do disco (file:///...), em vez de servir o
// projeto por um servidor local, faz o navegador bloquear várias
// requisições (cada arquivo "file:" vira uma origem própria) e mostra
// erros confusos no console. Avisamos isso de forma clara na própria tela.
(function avisarSeAbertoComoArquivo() {
  if (location.protocol !== 'file:') return;
  if (sessionStorage.getItem('avisoFileProtocolFechado') === '1') return;

  document.addEventListener('DOMContentLoaded', () => {
    const aviso = document.createElement('div');
    aviso.id = 'aviso-file-protocol';
    aviso.innerHTML = `
      <span>
        <i class="fa-solid fa-triangle-exclamation"></i>
        Esta página foi aberta direto do arquivo (<code>file://</code>). Para tudo funcionar,
        sirva o projeto por um servidor local — ex: extensão <strong>Live Server</strong> do VS Code,
        ou rode <code>npx serve</code> na pasta do projeto — e acesse via <code>http://localhost</code>.
      </span>
      <button type="button" aria-label="Fechar aviso">&times;</button>
    `;
    document.body.prepend(aviso);
    document.body.classList.add('has-file-warning');

    aviso.querySelector('button').addEventListener('click', () => {
      aviso.remove();
      document.body.classList.remove('has-file-warning');
      sessionStorage.setItem('avisoFileProtocolFechado', '1');
    });
  });
})();

async function apiGet(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`);
  if (!res.ok) throw new Error('Erro ao buscar dados na API');
  return res.json();
}

async function apiPost(endpoint, dados) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!res.ok) throw new Error('Erro ao salvar dados na API');
  return res.json();
}

async function apiPatch(endpoint, dados) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!res.ok) throw new Error('Erro ao atualizar dados na API');
  return res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir dados na API');
  return true;
}
