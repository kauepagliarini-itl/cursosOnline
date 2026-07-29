const API_URL = 'http://localhost:3000';

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
