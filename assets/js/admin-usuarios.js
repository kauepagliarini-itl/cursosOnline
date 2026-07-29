/**
 * admin-usuarios.js - Painel de Gestão de Usuários (Acesso exclusivo role 'admin')
 * Realiza as operações de CRUD, alteração de permissão (role) e ativação/desativação de contas.
 */

const API_URL = 'http://localhost:3000/usuarios';
let usuariosCache = [];
let modalUsuarioBootstrap = null;

// 1. Proteger a página: Permite apenas usuários logados com perfil 'admin'
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o SweetAlert e a verificação rodem se auth.js estiver carregado
    if (typeof exigirAutenticacao === 'function') {
        exigirAutenticacao(['admin']);
    }

    // Exibe o nome do administrador logado na navbar
    const usuarioLogado = typeof obterUsuarioLogado === 'function' ? obterUsuarioLogado() : null;
    if (usuarioLogado) {
        const elNome = document.getElementById('nomeUsuarioLogado');
        if (elNome) elNome.textContent = usuarioLogado.nome;
    }

    // Inicializa o elemento do Modal Bootstrap
    const modalEl = document.getElementById('modalUsuario');
    if (modalEl) {
        modalUsuarioBootstrap = new bootstrap.Modal(modalEl);
    }

    // Listener do Formulário
    const formUsuario = document.getElementById('formUsuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', salvarUsuario);
    }

    // Carrega a lista inicial de usuários
    carregarUsuarios();
});

/**
 * Buscas os usuários via GET na API e chama a função de renderização
 */
async function carregarUsuarios() {
    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error('Erro ao buscar usuários do servidor.');
        
        usuariosCache = await resposta.json();
        renderizarTabela(usuariosCache);
    } catch (erro) {
        console.error(erro);
        Swal.fire({
            icon: 'error',
            title: 'Erro de Conexão',
            text: 'Não foi possível carregar a lista de usuários. Verifique se o json-server está rodando.'
        });
    }
}

/**
 * Renderiza as linhas da tabela de usuários com badges e botões de ação
 */
function renderizarTabela(usuarios) {
    const tbody = document.getElementById('tabelaUsuarios');
    if (!tbody) return;

    if (usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">Nenhum usuário cadastrado.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usuarios.map(u => {
        // Formatação das Badges de Role
        let badgeRoleClass = 'bg-secondary';
        if (u.role === 'admin') badgeRoleClass = 'bg-danger';
        else if (u.role === 'editor') badgeRoleClass = 'bg-info text-dark';
        else if (u.role === 'aluno') badgeRoleClass = 'bg-success';

        // Status Ativo/Inativo
        const badgeStatus = u.ativo !== false 
            ? `<span class="badge bg-success-subtle text-success border border-success">Ativo</span>`
            : `<span class="badge bg-danger-subtle text-danger border border-danger">Inativo</span>`;

        return `
            <tr>
                <td class="fw-semibold">${escaparHTML(u.nome)}</td>
                <td>${escaparHTML(u.email)}</td>
                <td><span class="badge ${badgeRoleClass}">${u.role.toUpperCase()}</span></td>
                <td>${badgeStatus}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="prepararEdicao('${u.id}')" title="Editar Usuário">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm ${u.ativo !== false ? 'btn-outline-danger' : 'btn-outline-success'}" 
                            onclick="alternarStatus('${u.id}', ${u.ativo !== false})" 
                            title="${u.ativo !== false ? 'Desativar Conta' : 'Ativar Conta'}">
                        <i class="fa-solid ${u.ativo !== false ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Limpa o formulário e prepara para cadastrar um Novo Usuário
 */
function prepararModalCriacao() {
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('modalUsuarioLabel').textContent = 'Novo Usuário';
}

/**
 * Preenche o formulário com os dados existentes de um usuário para Edição
 */
function prepararEdicao(id) {
    const usuario = usuariosCache.find(u => u.id == id);
    if (!usuario) return;

    document.getElementById('usuarioId').value = usuario.id;
    document.getElementById('nome').value = usuario.nome;
    document.getElementById('email').value = usuario.email;
    document.getElementById('senha').value = usuario.senha;
    document.getElementById('role').value = usuario.role;

    document.getElementById('modalUsuarioLabel').textContent = 'Editar Usuário';
    modalUsuarioBootstrap.show();
}

/**
 * Processa a criação (POST) ou edição (PATCH) com todas as validações obrigatórias
 */
async function salvarUsuario(event) {
    event.preventDefault();

    const id = document.getElementById('usuarioId').value;
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const role = document.getElementById('role').value;

    // --- VALIDAÇÕES MANUAIS (IF/ELSE) ---
    // 1. Nome: mínimo 3 caracteres
    if (nome.length < 3) {
        Swal.fire('Atenção', 'O nome deve ter no mínimo 3 caracteres.', 'warning');
        return;
    }

    // 2. Email: formato válido por regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Swal.fire('Atenção', 'Informe um e-mail com formato válido (ex: usuario@email.com).', 'warning');
        return;
    }

    // 3. Email: único na base de dados (verificar se já existe em outro ID)
    const emailExiste = usuariosCache.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id != id);
    if (emailExiste) {
        Swal.fire('Atenção', 'Este e-mail já está cadastrado para outro usuário.', 'warning');
        return;
    }

    // 4. Senha: mínimo 6 caracteres
    if (senha.length < 6) {
        Swal.fire('Atenção', 'A senha deve ter pelo menos 6 caracteres.', 'warning');
        return;
    }

    // 5. Role: apenas 'aluno', 'editor' ou 'admin'
    if (!['aluno', 'editor', 'admin'].includes(role)) {
        Swal.fire('Atenção', 'Perfil selecionado é inválido.', 'warning');
        return;
    }

    try {
        if (id) {
            // Edição via PATCH
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, role })
            });

            if (!resposta.ok) throw new Error('Falha ao atualizar usuário.');

            Swal.fire('Sucesso!', 'Dados do usuário atualizados com sucesso.', 'success');
        } else {
            // Criação via POST (ativo: true por padrão)
            const novoUsuario = { nome, email, senha, role, ativo: true };

            const resposta = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoUsuario)
            });

            if (!resposta.ok) throw new Error('Falha ao cadastrar novo usuário.');

            Swal.fire('Sucesso!', 'Novo usuário cadastrado com sucesso.', 'success');
        }

        modalUsuarioBootstrap.hide();
        carregarUsuarios();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível salvar o usuário no servidor.', 'error');
    }
}

/**
 * Alterna o status `ativo` (true/false) do usuário sem deletar do banco
 */
async function alternarStatus(id, statusAtual) {
    const novoStatus = !statusAtual;
    const acaoTexto = novoStatus ? 'ativar' : 'desativar';

    const confirmacao = await Swal.fire({
        title: `Deseja ${acaoTexto} este usuário?`,
        text: novoStatus ? 'O usuário voltará a ter acesso ao sistema.' : 'O usuário não conseguirá mais fazer login.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Sim, ${acaoTexto}!`,
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacao.isConfirmed) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: novoStatus })
        });

        if (!resposta.ok) throw new Error('Erro ao alterar status.');

        Swal.fire('Atualizado!', `O usuário foi ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`, 'success');
        carregarUsuarios();
    } catch (erro) {
        console.error(erro);
        Swal.fire('Erro', 'Não foi possível alterar o status do usuário.', 'error');
    }
}

/**
 * Helper simples para escapar HTML e evitar XSS
 */
function escaparHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => {
        const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[match];
    });
}
