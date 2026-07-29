prompt Kaue

Crie apenas o arquivo `auth.js`. Ele será uma biblioteca utilitária compartilhada usada por mim e pela Bruna.

Regras do `auth.js`:
1. Função `obterUsuarioLogado()`: Retorna o objeto JSON salvo no localStorage com a chave `usuarioLogado`.
2. Função `exigirAutenticacao(rolesPermitidos)`: 
   - Lê o usuário logado.
   - Se não houver usuário ou se `ativo === false`, exibe alerta no SweetAlert2 e redireciona para `login.html`.
   - Se a role do usuário não estiver no array `rolesPermitidos`, exibe alerta "Acesso Negado" e redireciona para `catalogo.html`.
3. Função `fazerLogout()`: Limpa o `usuarioLogado` do localStorage e redireciona para `login.html`.

Escreva o código em JS Vanilla, limpo, modular e comentado. Não altere nenhum outro arquivo.

=================
passo 2:: Painel do Administrador (admin-usuarios.html + admin-usuarios.js)

Trabalhe APENAS nos arquivos `admin-usuarios.html` e `admin-usuarios.js`. Não crie ou edite arquivos da Bruna.

Objetivo: Painel CRUD de Usuários (Acesso restrito apenas para role 'admin').

Requisitos do `admin-usuarios.html`:
1. Menu de navegação (Navbar Bootstrap) com botão Logout.
2. Tabela Bootstrap exibindo: Nome, Email, Role (badge), Status (Ativo/Inativo) e Ações (Editar, Ativar/Desativar).
3. Botão "+ Novo Usuário" que abre um Modal Bootstrap com formulário.

Requisitos do `admin-usuarios.js`:
1. Chamar `exigirAutenticacao(['admin'])` no início.
2. GET em `http://localhost:3000/usuarios` e renderizar na tabela.
3. Validações manuais (if/else) no Submit do formulário:
   - Nome: min 3 letras.
   - Email: formato válido (regex) e único na base (verificar se já existe no json-server).
   - Senha: min 6 caracteres.
   - Role: apenas 'aluno', 'editor' ou 'admin'.
4. POST para criar novo usuário (`ativo` deve ser `true` por padrão).
5. PUT/PATCH para editar dados ou alterar o role de qualquer usuário.
6. PATCH para chavear o campo `ativo` (true/false) sem deletar o registro.
7. Usar SweetAlert2 para confirmações e notificações de sucesso/erro.

Passo 3: Painel do Editor - Cursos e Categorias (editor-cursos.html + editor-cursos.js)
Plaintext
Trabalhe APENAS nos arquivos `editor-cursos.html` e `editor-cursos.js`. Não altere outros arquivos.

Objetivo: Gestão de Cursos e Categorias (Acesso para roles 'editor' e 'admin').

Requisitos do `editor-cursos.html`:
1. Aba ou Seção 1: Gestão de Categorias (Formulário rápido + lista de categorias existentes).
2. Aba ou Seção 2: Tabela de Cursos com colunas: Título, Categoria, Carga Horária, Status (Rascunho/Publicado), Ações (Editar, Gerenciar Aulas).
3. Modal para criar/editar Cursos.

Requisitos do `editor-cursos.js`:
1. Chamar `exigirAutenticacao(['editor', 'admin'])` no início.
2. Preencher o `<select>` de Categorias do formulário buscando via GET no `/categorias`.
3. Validações do Curso:
   - Título: min 5 caracteres.
   - CategoriaId: obrigatório selecionar uma existente.
   - InstrutorId: recebe o ID do usuário logado (pego do `auth.js`).
   - Status: apenas 'rascunho' ou 'publicado'.
   - CargaHoraria: número maior que 0.
4. Salvar Curso via POST (ou PUT se for edição) no `/cursos`.
5. Validação da Categoria: Nome é obrigatório e único. Salvar via POST no `/categorias`.
6. Adicionar botão em cada curso: "Gerenciar Aulas", que redireciona para `editor-aulas.html?cursoId=ID_DO_CURSO`.


📌 Passo 4: Painel do Editor - Aulas (editor-aulas.html + editor-aulas.js)
Plaintext
Trabalhe APENAS nos arquivos `editor-aulas.html` e `editor-aulas.js`.

Objetivo: Gerenciar Aulas do Curso selecionado.

Requisitos do `editor-aulas.html` e `editor-aulas.js`:
1. Ler o `cursoId` do parâmetro da URL (`URLSearchParams`).
2. Fazer GET em `http://localhost:3000/cursos/ID_DO_CURSO` para exibir o nome do Curso no cabeçalho.
3. Listar em uma tabela/cards as aulas que pertencem a esse curso (GET em `/aulas?cursoId=ID_DO_CURSO`).
4. Formulário/Modal para cadastrar nova aula no endpoint `/aulas`:
   - Validações: Título obrigatório, Ordem (número inteiro positivo), Duração (minutos positivos).
5. Permitir editar e excluir aulas do curso.