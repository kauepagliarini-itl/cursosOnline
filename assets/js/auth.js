/**
 * auth.js - Biblioteca utilitária compartilhada de autenticação e sessão.
 * Responsável por gerenciar o usuário logado no localStorage e proteger rotas por perfil (role).
 */

/**
 * 1. Obtém os dados do usuário atualmente logado no sistema.
 * @returns {Object|null} Objeto com dados do usuário ou null se não estiver logado.
 */
function obterUsuarioLogado() {
    const usuarioString = localStorage.getItem('usuarioLogado');
    if (!usuarioString) {
        return null;
    }
    try {
        return JSON.parse(usuarioString);
    } catch (error) {
        console.error('Erro ao ler dados do usuário no localStorage:', error);
        return null;
    }
}

/**
 * 2. Verifica se existe usuário logado, se ele está ativo e se possui permissão de role.
 * Caso não satisfaça os requisitos, exibe alerta e redireciona.
 * @param {Array<string>} rolesPermitidos - Lista de roles autorizadas a acessar a página (ex: ['admin'], ['editor', 'admin']).
 */
function exigirAutenticacao(rolesPermitidos = []) {
    const usuario = obterUsuarioLogado();

    // Caso 1: Não há usuário logado OU a conta foi desativada
    if (!usuario || usuario.ativo === false) {
        Swal.fire({
            icon: 'warning',
            title: 'Sessão necessária',
            text: 'Você precisa estar logado com uma conta ativa para acessar esta página.',
            confirmButtonText: 'Ir para Login'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    // Caso 2: O usuário tem conta, mas o seu perfil (role) não está autorizado para esta página
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.role)) {
        Swal.fire({
            icon: 'error',
            title: 'Acesso Negado',
            text: 'Você não tem permissão para acessar esta área.',
            confirmButtonText: 'Voltar ao Catálogo'
        }).then(() => {
            window.location.href = 'catalogo.html';
        });
    }
}

/**
 * 3. Encerra a sessão do usuário e redireciona para a tela de login.
 */
function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    Swal.fire({
        icon: 'info',
        title: 'Sessão Encerrada',
        text: 'Você saiu da plataforma com sucesso.',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        window.location.href = 'login.html';
    });
    const ROLE_LABELS = { aluno: 'Aluno', editor: 'Editor', admin: 'Administrador' };
}

function getUsuarioLogado() {
    const raw = sessionStorage.getItem('usuarioLogado') || localStorage.getItem('usuarioLogado');
    return raw ? JSON.parse(raw) : null;
}

// Atualiza o usuário da sessão ativa (localStorage ou sessionStorage, o que
// já estiver em uso) sem exigir novo login — usado após editar o perfil.
function atualizarUsuarioLogado(patch) {
    const usuarioAtual = getUsuarioLogado();
    if (!usuarioAtual) return null;

    const atualizado = { ...usuarioAtual, ...patch };
    const payload = JSON.stringify(atualizado);

    if (sessionStorage.getItem('usuarioLogado')) {
        sessionStorage.setItem('usuarioLogado', payload);
    } else {
        localStorage.setItem('usuarioLogado', payload);
    }

    return atualizado;
}

function logout() {
    sessionStorage.removeItem('usuarioLogado');
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}

// Garante que só usuários com um dos "roles" permitidos acessem a tela.
// Sem sessão -> volta pro login. Sessão sem o role certo -> volta pro dashboard.
function exigirRole(rolesPermitidos) {
    const usuario = getUsuarioLogado();

    if (!usuario) {
        window.location.href = 'index.html';
        return null;
    }

    if (!rolesPermitidos.includes(usuario.role)) {
        window.location.href = 'dashboard.html';
        return null;
    }

    return usuario;
}

function configurarLogout(botaoId = 'logout-btn') {
    const btn = document.getElementById(botaoId);
    if (btn) btn.addEventListener('click', logout);
}
