Aja como um Desenvolvedor Web Sênior e mentor didático. Estamos desenvolvendo um projeto de Plataforma de Cursos Online em DUPLA (Kauê e Bruna) usando JavaScript Vanilla (Puro).

:warning: ATENÇÃO - REGRAS RÍGIDAS DE ESCOPO E ARQUIVOS (NÃO ULTRAPASSAR):
1. Este projeto está sendo desenvolvido em duas frentes independentes que serão unificadas no final.
2. Você NÃO DEVE criar, modificar ou apagar nenhum arquivo pertencente ao escopo da Bruna.
3. Altere APENAS os arquivos do escopo do Kauê ou arquivos compartilhados autorizados.
4. Garanta a compatibilidade absoluta de dados, chaves e localStorage para que o projeto rode 100% sem bugs quando os arquivos forem juntados na pasta raiz.

:open_file_folder: ESTRUTURA GLOBAL E DIVISÃO DE ARQUIVOS DO PROJETO:

--- MÓDULO DO KAUÊ (Escopo Exclusivo do Kauê) ---
- `admin-usuarios.html` & `admin-usuarios.js` -> Painel de Gestão de Usuários (CRUD)
- `editor-cursos.html` & `editor-cursos.js`   -> Painel de Gestão de Cursos e Categorias (CRUD)
- `editor-aulas.html` & `editor-aulas.js`     -> Gestão de Aulas do Curso (CRUD)

--- MÓDULO DA BRUNA (PROIBIDO EDITAR/ALTERAR) ---
- `login.html` & `login.js`                  -> Autenticação Fake e login de usuários
- `catalogo.html` & `catalogo.js`            -> Vitrine de Cursos para Alunos
- `curso.html` & `curso.js`                  -> Detalhes do Curso e Player de Aulas
- `perfil.html` & `perfil.js`                -> Meu Perfil e Atualização de Progresso
- `avaliacoes.js`                            -> Sistema de Avaliação de Cursos Concluídos

--- ARQUIVOS COMPARTILHADOS (Manter Contrato Rigoroso) ---
- `db.json`                                  -> Banco de dados mockado para o json-server (porta 3000)
- `style.css`                                -> CSS Global compartilhado (Bootstrap 5 + estilos customizados)
- `auth.js`                                 -> Utilitários de Checagem de Sessão (leitura/escrita do localStorage)

:toolbox: STACK TÉCNICA OBRIGATÓRIA:
- HTML5, CSS3 (Bootstrap 5 + SweetAlert2 + Font Awesome)
- JavaScript Vanilla (Fetch API, manipulação de DOM, funções simples, async/await, if/else, array methods)
- Backend: json-server em http://localhost:3000

:key: CONTRATO DE DADOS E SESSÃO (MANTENHA EXATAMENTE ESTE PADRÃO):
1. Usuário Logado é salvo no localStorage sob a chave: `usuarioLogado`
   Exemplo: JSON.parse(localStorage.getItem('usuarioLogado')) -> objeto { id, nome, email, role, ativo }
2. Roles possíveis: "aluno", "editor", "admin"
3. Toda verificação de permissão deve ler essa mesma chave `usuarioLogado`.

Responda apenas com: "Entendido! Estrutura e limites de escopo reconhecidos. Qual arquivo do escopo do Kauê vamos criar ou editar agora?" sem modificar nada ainda.
[9h59]Prompts para a BRUNA (Claude / Gemini)
:pushpin: Passo 1: Tela de Login Simulado (login.html + login.js)
Plaintext



Trabalhe APENAS nos arquivos `login.html` e `login.js`. Não altere arquivos de painéis do Admin/Editor.

Objetivo: Tela de login fake que autentica o usuário no `json-server` e salva na sessão.

Requisitos do `login.html`:
1. Layout centralizado Bootstrap com campos de E-mail e Senha.
2. Botão de "Entrar".

Requisitos do `login.js`:
1. No submit do formulário, capturar email e senha.
2. Fazer GET em `
http://localhost:3000/usuarios?email=EMAIL_DIGITADO&senha=SENHA_DIGITADA`.
3. Validações do resultado:
   - Se o retorno for um array vazio: Exibir SweetAlert2 "Usuário ou senha inválidos".
   - Se encontrar o usuário, mas `ativo === false`: Exibir SweetAlert2 "Conta desativada pelo Administrador".
   - Se encontrar e `ativo === true`: Salvar o objeto do usuário no `localStorage` sob a chave `usuarioLogado` usando `JSON.stringify()`.
4. Redirecionamento após login com sucesso: Redirecionar para `catalogo.html`.:pushpin: Passo 2: Catálogo de Cursos (catalogo.html + catalogo.js)
Plaintext



Trabalhe APENAS nos arquivos `catalogo.html` e `catalogo.js`.

Objetivo: Vitrine de cursos disponíveis para visualização e filtro.

Requisitos do `catalogo.html` e `catalogo.js`:
1. Verificar login lendo a chave `usuarioLogado` do localStorage. Se não existir, redirecionar para `login.html`.
2. Buscar no endpoint `/categorias` para preencher os botões/select de filtro de categoria.
3. Buscar no endpoint `/cursos?status=publicado` para exibir SOMENTE cursos publicados.
4. Renderizar os cursos em formato de Cards do Bootstrap (Título, Carga Horária, Categoria).
5. Ao clicar em um Card de curso, redirecionar para `curso.html?id=ID_DO_CURSO`.
6. Adicionar barra de navegação superior com link para "Meu Perfil" e botão "Sair" (limpa localStorage).:pushpin: Passo 3: Página do Curso, Matrícula e Player (
curso.html + curso.js)
Plaintext



Trabalhe APENAS nos arquivos `curso.html` e `curso.js`.

Objetivo: Detalhes do curso, lista de aulas, fluxo de matrícula e atualização de progresso.

Requisitos do `curso.html` e `curso.js`:
1. Pegar o `id` da URL via `URLSearchParams`.
2. Carregar dados do Curso (`/cursos/ID`) e Aulas (`/aulas?cursoId=ID`).
3. Verificar se o aluno já possui registro em `/matriculas?usuarioId=ID_LOGADO&cursoId=ID_CURSO`:
   - SE NÃO ESTIVER MATRICULADO: Mostrar botão "Matricular-se no Curso".
     - Clique do botão: Faz POST em `/matriculas` com `{ usuarioId, cursoId, dataMatricula, progresso: 0, status: "em andamento" }` e recarrega a tela.
   - SE JA ESTIVER MATRICULADO:
     - Ocultar botão de matrícula e exibir Barra de Progresso Bootstrap (% do progresso atual).
     - Permitir que o aluno marque aulas como concluídas, atualizando o progresso no backend (PATCH em `/matriculas/ID_MATRICULA`).
     - Se o progresso atingir 100%, atualizar o `status` da matrícula para `"concluído"`.
4. Exibir lista de avaliações do curso trazidas do endpoint `/avaliacoes?cursoId=ID`.:pushpin: Passo 4: Sistema de Avaliações e Perfil (
perfil.html + perfil.js + avaliacoes.js)
Plaintext



Trabalhe nos arquivos `perfil.html`, `perfil.js` e `avaliacoes.js`.

Objetivo: Edição de perfil do usuário e envio de nota/comentário nos cursos concluídos.

Requisitos do `perfil.html` e `perfil.js`:
1. Formulário para o usuário editar seu próprio Nome e Senha.
2. Não permitir alterar o campo `role` ou `email` diretamente.
3. PUT/PATCH em `/usuarios/ID_LOGADO` e atualizar os dados no `localStorage`.

Requisitos do `avaliacoes.js` (Componente de Avaliação dentro de `curso.html`):
1. Verificar se a matrícula do usuário para aquele curso tem `status === "concluído"`.
2. Se estiver concluído, liberar o formulário de Avaliação:
   - `nota`: Select/Radio de 1 a 5 (obrigatório).
   - `comentario`: Textarea opcional (máx 500 caracteres).
3. Verificar se o usuário já avaliou este curso em `/avaliacoes?usuarioId=ID_LOGADO&cursoId=ID_CURSO`. Não permitir avaliação duplicada.
4. Enviar POST para `/avaliacoes`.