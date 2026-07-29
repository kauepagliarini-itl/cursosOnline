/**
 * editor-aulas.js - Gerenciamento de Aulas por Curso (Acesso roles 'editor' e 'admin')
 * Lê o cursoId da URL via URLSearchParams e executa o CRUD no endpoint /aulas.
 */

const API_CURSOS = 'http://localhost:3000/cursos';
const API_AULAS = 'http://localhost:3000/aulas';

let cursoAtual = null;
let aulasCache = [];
let modalAulaBootstrap = null;
let cursoIdParam = null;

// 1. Proteger a página e ler o ID da URL
document.addEventListener('DOMContentLoaded', () => {
    // Exigir autenticação
    if (typeof exigirAutenticacao === 'function') {
        exigirAutenticacao(['editor', 'admin']);
    }

    const usuarioLogado = typeof obterUsuarioLogado === 'function' ? obterUsuarioLogado() : null;
    if (usuarioLogado) {
        const elNome = document.getElementById('nomeUsuarioLogado');
        if (elNome) elNome.textContent = usuarioLogado.nome;
    }

    // Modal Bootstrap
    const modalEl = document.getElementById('modalAula');
    if (modalEl) {
        modalAulaBootstrap = new bootstrap.Modal(modalEl);
    }

    // Capturar cursoId dos parâmetros da URL (?cursoId=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    cursoIdParam = urlParams.get('cursoId');

    if (!cursoIdParam) {
        Swal.fire({
            icon: 'error',
            title: 'Curso não especificado',
            text: 'Selecione um curso no painel para gerenciar suas aulas.'
        }).then(() => {
            window.location.href = 'editor-cursos.html';
        });
        return;
    }

    // Listener do Formulário
    document.getElementById('formAula')?.addEventListener('submit', salvarAula);

    // Carregar informações do curso e suas aulas
    carregarCursoEAulas();
});

/**
 * Busca os dados do curso e as aulas correspondentes
 */
async function carregarCursoEAulas() {
    try {
        // 1. GET do Curso
        const resCurso = await fetch(`${API_CURSOS}/${cursoIdParam}`);
        if (!resCurso.ok) throw new Error('Curso não encontrado.');
        cursoAtual = await resCurso.json();

        // Exibir no cabeçalho
        document.getElementById('tituloCurso').textContent = cursoAtual.titulo;
        document.getElementById('detalhesCurso').textContent = `Carga Horária: ${cursoAtual.cargaHoraria}h | Status: ${cursoAtual.status.toUpperCase()}`;

        // 2. GET das Aulas do Curso (/aulas?cursoId=XYZ)
        const resAulas = await fetch(`${API_AULAS}?cursoId=${cursoIdParam}`);
        if (!resAulas.ok) throw new Error('Erro ao carregar aulas.');
        
        aulasCache = await resAulas.json();
        
        // Ordenar aulas pela ordem definida
        aulasCache.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        renderizarAulas();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível carregar as informações do curso.', 'error');
    }
}

/**
 * Renderiza a tabela de aulas
 */
function renderizarAulas() {
    const tbody = document.getElementById('tabelaAulas');
    const badgeTotal = document.getElementById('totalAulasBadge');
    if (!tbody) return;

    if (badgeTotal) badgeTotal.textContent = `${aulasCache.length} aula(s)`;

    if (aulasCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhuma aula cadastrada para este curso.</td></tr>`;
        return;
    }

    tbody.innerHTML = aulasCache.map(a => `
        <tr>
            <td class="fw-bold text-center"><span class="badge bg-secondary">${a.ordem}</span></td>
            <td class="fw-semibold">${escaparHTML(a.titulo)}</td>
            <td>${a.duracaoMinutos} min</td>
            <td>
                ${a.conteudo ? `<a href="${escaparHTML(a.conteudo)}" target="_blank" class="text-truncate d-inline-block style="max-width: 200px;"><i class="fa-solid fa-link me-1"></i>Ver Link</a>` : '<span class="text-muted">Sem vídeo</span>'}
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="prepararEdicaoAula('${a.id}')" title="Editar Aula">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirAula('${a.id}')" title="Excluir Aula">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Prepara o modal para cadastrar uma Nova Aula
 */
function prepararModalCriacaoAula() {
    document.getElementById('formAula').reset();
    document.getElementById('aulaId').value = '';
    
    // Sugere a próxima ordem automaticamente
    const proximaOrdem = aulasCache.length > 0 ? Math.max(...aulasCache.map(a => Number(a.ordem) || 0)) + 1 : 1;
    document.getElementById('ordemAula').value = proximaOrdem;

    document.getElementById('modalAulaLabel').textContent = 'Nova Aula';
}

/**
 * Preenche o modal para editar uma aula existente
 */
function prepararEdicaoAula(id) {
    const aula = aulasCache.find(a => a.id == id);
    if (!aula) return;

    document.getElementById('aulaId').value = aula.id;
    document.getElementById('tituloAula').value = aula.titulo;
    document.getElementById('ordemAula').value = aula.ordem;
    document.getElementById('duracaoMinutos').value = aula.duracaoMinutos;
    document.getElementById('conteudoAula').value = aula.conteudo || '';

    document.getElementById('modalAulaLabel').textContent = 'Editar Aula';
    modalAulaBootstrap.show();
}

/**
 * Salva a aula (POST ou PATCH) com validações
 */
async function salvarAula(e) {
    e.preventDefault();

    const id = document.getElementById('aulaId').value;
    const titulo = document.getElementById('tituloAula').value.trim();
    const ordem = Number(document.getElementById('ordemAula').value);
    const duracaoMinutos = Number(document.getElementById('duracaoMinutos').value);
    const conteudo = document.getElementById('conteudoAula').value.trim();

    // --- VALIDAÇÕES MANUAIS (IF/ELSE) ---
    // 1. Título obrigatório
    if (!titulo) {
        Swal.fire('Atenção', 'Informe o título da aula.', 'warning');
        return;
    }

    // 2. Ordem: inteiro positivo
    if (!ordem || ordem < 1) {
        Swal.fire('Atenção', 'A ordem da aula deve ser um número positivo (ex: 1, 2, 3).', 'warning');
        return;
    }

    // 3. Duração: minutos positivos
    if (!duracaoMinutos || duracaoMinutos < 1) {
        Swal.fire('Atenção', 'A duração deve ser maior que 0 minutos.', 'warning');
        return;
    }

    const payload = {
        cursoId: cursoIdParam,
        titulo,
        ordem,
        duracaoMinutos,
        conteudo
    };

    try {
        if (id) {
            // Editar via PATCH
            const res = await fetch(`${API_AULAS}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao atualizar aula.');
            Swal.fire('Sucesso!', 'Aula atualizada com sucesso.', 'success');
        } else {
            // Criar via POST
            const res = await fetch(API_AULAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao cadastrar aula.');
            Swal.fire('Sucesso!', 'Aula cadastrada com sucesso.', 'success');
        }

        modalAulaBootstrap.hide();
        carregarCursoEAulas();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível salvar a aula.', 'error');
    }
}

/**
 * Exclui uma aula via DELETE
 */
async function excluirAula(id) {
    const confirmacao = await Swal.fire({
        title: 'Excluir esta aula?',
        text: 'Esta ação não poderá ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacao.isConfirmed) return;

    try {
        const res = await fetch(`${API_AULAS}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir aula.');

        Swal.fire('Excluído!', 'A aula foi removida com sucesso.', 'success');
        carregarCursoEAulas();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível excluir a aula.', 'error');
    }
}

/**
 * Helper simples para escapar HTML
 */
function escaparHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => {
        const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[match];
    });
}
