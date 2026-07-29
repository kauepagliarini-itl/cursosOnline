/**
 * editor-cursos.js - Gestão de Cursos e Categorias (Acesso para roles 'editor' e 'admin')
 * Gerencia a criação de categorias únicas e o CRUD de Cursos com vinculação do Instrutor logado.
 */

const API_CURSOS = 'http://localhost:3000/cursos';
const API_CATEGORIAS = 'http://localhost:3000/categorias';

let cursosCache = [];
let categoriasCache = [];
let modalCursoBootstrap = null;

// 1. Proteger a página e inicializar componentes
document.addEventListener('DOMContentLoaded', () => {
    // Exigir perfil de 'editor' ou 'admin'
    if (typeof exigirAutenticacao === 'function') {
        exigirAutenticacao(['editor', 'admin']);
    }

    const usuarioLogado = typeof obterUsuarioLogado === 'function' ? obterUsuarioLogado() : null;
    if (usuarioLogado) {
        const elNome = document.getElementById('nomeUsuarioLogado');
        if (elNome) elNome.textContent = `${usuarioLogado.nome} (${usuarioLogado.role.toUpperCase()})`;

        // Exibe o link do Painel Admin apenas se o usuário for admin
        if (usuarioLogado.role === 'admin') {
            const navAdmin = document.getElementById('navItemAdmin');
            if (navAdmin) navAdmin.style.display = 'block';
        }
    }

    // Modal Bootstrap
    const modalEl = document.getElementById('modalCurso');
    if (modalEl) {
        modalCursoBootstrap = new bootstrap.Modal(modalEl);
    }

    // Listeners dos formulários
    document.getElementById('formCurso')?.addEventListener('submit', salvarCurso);
    document.getElementById('formCategoria')?.addEventListener('submit', salvarCategoria);

    // Carregar dados iniciais
    carregarDados();
});

/**
 * Carrega Categorias e Cursos do json-server
 */
async function carregarDados() {
    await carregarCategorias();
    await carregarCursos();
}

/**
 * Busca e renderiza as Categorias
 */
async function carregarCategorias() {
    try {
        const res = await fetch(API_CATEGORIAS);
        if (!res.ok) throw new Error('Erro ao buscar categorias.');
        
        categoriasCache = await res.json();
        renderizarCategorias();
        popularSelectCategorias();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível carregar as categorias.', 'error');
    }
}

/**
 * Renderiza a lista de categorias na barra lateral
 */
function renderizarCategorias() {
    const lista = document.getElementById('listaCategorias');
    if (!lista) return;

    if (categoriasCache.length === 0) {
        lista.innerHTML = `<li class="list-group-item text-center text-muted">Nenhuma categoria cadastrada.</li>`;
        return;
    }

    lista.innerHTML = categoriasCache.map(cat => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <span><i class="fa-solid fa-folder me-2 text-primary"></i>${escaparHTML(cat.nome)}</span>
            <span class="badge bg-light text-dark border">${contarCursosPorCategoria(cat.id)} cursos</span>
        </li>
    `).join('');
}

/**
 * Preenche a caixa de seleção (<select>) no modal de cursos
 */
function popularSelectCategorias() {
    const select = document.getElementById('categoriaId');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione uma categoria...</option>' + 
        categoriasCache.map(cat => `<option value="${cat.id}">${escaparHTML(cat.nome)}</option>`).join('');
}

/**
 * Busca e renderiza a tabela de Cursos
 */
async function carregarCursos() {
    try {
        const res = await fetch(API_CURSOS);
        if (!res.ok) throw new Error('Erro ao buscar cursos.');

        cursosCache = await res.json();
        renderizarCursos();
        renderizarCategorias(); // Atualiza a contagem nas categorias
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível carregar a lista de cursos.', 'error');
    }
}

/**
 * Renderiza a tabela de Cursos
 */
function renderizarCursos() {
    const tbody = document.getElementById('tabelaCursos');
    if (!tbody) return;

    if (cursosCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum curso cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = cursosCache.map(c => {
        const cat = categoriasCache.find(item => item.id == c.categoriaId);
        const nomeCategoria = cat ? cat.nome : 'Sem categoria';

        const badgeStatus = c.status === 'publicado'
            ? `<span class="badge bg-success">Publicado</span>`
            : `<span class="badge bg-warning text-dark">Rascunho</span>`;

        return `
            <tr>
                <td class="fw-semibold">${escaparHTML(c.titulo)}</td>
                <td><span class="badge bg-secondary">${escaparHTML(nomeCategoria)}</span></td>
                <td>${c.cargaHoraria} horas</td>
                <td>${badgeStatus}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="prepararEdicaoCurso('${c.id}')" title="Editar Curso">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <a href="editor-aulas.html?cursoId=${c.id}" class="btn btn-sm btn-outline-info" title="Gerenciar Aulas">
                        <i class="fa-solid fa-list-check me-1"></i>Aulas
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Salva uma nova Categoria com validação de unicidade
 */
async function salvarCategoria(e) {
    e.preventDefault();
    const inputNome = document.getElementById('nomeCategoria');
    const nome = inputNome.value.trim();

    // Validação: Nome obrigatório
    if (!nome) {
        Swal.fire('Atenção', 'Informe o nome da categoria.', 'warning');
        return;
    }

    // Validação: Nome único na base
    const jaExiste = categoriasCache.some(cat => cat.nome.toLowerCase() === nome.toLowerCase());
    if (jaExiste) {
        Swal.fire('Atenção', 'Já existe uma categoria cadastrada com este nome.', 'warning');
        return;
    }

    try {
        const res = await fetch(API_CATEGORIAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });

        if (!res.ok) throw new Error('Erro ao salvar categoria.');

        Swal.fire('Sucesso!', 'Categoria criada com sucesso.', 'success');
        inputNome.value = '';
        carregarCategorias();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível salvar a categoria.', 'error');
    }
}

/**
 * Prepara o modal para criar um Novo Curso
 */
function prepararModalCriacaoCurso() {
    document.getElementById('formCurso').reset();
    document.getElementById('cursoId').value = '';
    document.getElementById('modalCursoLabel').textContent = 'Novo Curso';
}

/**
 * Preenche o modal para edição de um Curso
 */
function prepararEdicaoCurso(id) {
    const curso = cursosCache.find(c => c.id == id);
    if (!curso) return;

    document.getElementById('cursoId').value = curso.id;
    document.getElementById('titulo').value = curso.titulo;
    document.getElementById('categoriaId').value = curso.categoriaId;
    document.getElementById('cargaHoraria').value = curso.cargaHoraria;
    document.getElementById('status').value = curso.status;

    document.getElementById('modalCursoLabel').textContent = 'Editar Curso';
    modalCursoBootstrap.show();
}

/**
 * Processa a criação ou edição de Cursos com todas as validações obrigatórias
 */
async function salvarCurso(e) {
    e.preventDefault();

    const id = document.getElementById('cursoId').value;
    const titulo = document.getElementById('titulo').value.trim();
    const categoriaId = document.getElementById('categoriaId').value;
    const cargaHoraria = Number(document.getElementById('cargaHoraria').value);
    const status = document.getElementById('status').value;

    const usuarioLogado = typeof obterUsuarioLogado === 'function' ? obterUsuarioLogado() : null;
    const instrutorId = usuarioLogado ? usuarioLogado.id : null;

    // --- VALIDAÇÕES MANUAIS (IF/ELSE) ---
    // 1. Título: mínimo 5 caracteres
    if (titulo.length < 5) {
        Swal.fire('Atenção', 'O título do curso deve ter pelo menos 5 caracteres.', 'warning');
        return;
    }

    // 2. Categoria: obrigatória
    if (!categoriaId) {
        Swal.fire('Atenção', 'Selecione uma categoria válida.', 'warning');
        return;
    }

    // 3. Status: 'rascunho' ou 'publicado'
    if (!['rascunho', 'publicado'].includes(status)) {
        Swal.fire('Atenção', 'Status inválido.', 'warning');
        return;
    }

    // 4. Carga Horária: número positivo
    if (!cargaHoraria || cargaHoraria <= 0) {
        Swal.fire('Atenção', 'A carga horária deve ser um número positivo maior que 0.', 'warning');
        return;
    }

    const payload = {
        titulo,
        categoriaId,
        instrutorId,
        status,
        cargaHoraria
    };

    try {
        if (id) {
            // Edição via PUT/PATCH
            const res = await fetch(`${API_CURSOS}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao atualizar curso.');
            Swal.fire('Sucesso!', 'Curso atualizado com sucesso.', 'success');
        } else {
            // Criação via POST
            const res = await fetch(API_CURSOS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Falha ao cadastrar curso.');
            Swal.fire('Sucesso!', 'Curso cadastrado com sucesso.', 'success');
        }

        modalCursoBootstrap.hide();
        carregarCursos();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível salvar o curso.', 'error');
    }
}

/**
 * Contagem auxiliar de cursos por categoria
 */
function contarCursosPorCategoria(categoriaId) {
    return cursosCache.filter(c => c.categoriaId == categoriaId).length;
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
