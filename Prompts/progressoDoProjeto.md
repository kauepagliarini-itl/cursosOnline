# 📊 Progresso Geral do Projeto - Plataforma de Cursos Online

## 👥 Divisão de Responsabilidades
- **Kauê**: `auth.js`, `admin-usuarios`, `editor-cursos`, `editor-aulas`
- **Bruna**: `login`, `catalogo`, `curso`, `perfil`, `avaliacoes.js`

---

## 📌 Status do Módulo do Kauê

### 🟢 Passo 1: Utilitário de Autenticação (`js/auth.js`)
- [x] Planejamento e explicação conceitual do `auth.js`
- [x] Arquivo organizado em `js/auth.js` com funções (`obterUsuarioLogado`, `exigirAutenticacao`, `fazerLogout`)

### 🟢 Passo 2: Painel do Administrador (`html/admin-usuarios.html` / `js/admin-usuarios.js`)
- [x] Planejamento e explicação conceitual da tela de gestão de usuários
- [x] Criado `html/admin-usuarios.html` (Navbar, Tabela, Modal)
- [x] Criado `js/admin-usuarios.js` (GET, POST, PATCH com validações manuais de nome, email único, senha e role)

### 🟢 Passo 3: Painel do Editor - Cursos (`html/editor-cursos.html` / `js/editor-cursos.js`)
- [x] Planejamento e explicação conceitual da gestão de cursos e categorias
- [x] Criado `html/editor-cursos.html` (Gestão de categorias e tabela de cursos)
- [x] Criado `js/editor-cursos.js` (GET, POST, PATCH de cursos e validação de nome único para categorias)

### 🟢 Passo 4: Painel do Editor - Aulas (`html/editor-aulas.html` / `js/editor-aulas.js`)
- [x] Planejamento e explicação conceitual da gestão de aulas
- [x] Criado `html/editor-aulas.html` (Cabeçalho do curso e tabela de aulas)
- [x] Criado `js/editor-aulas.js` (Captura de cursoId via URLSearchParams, CRUD completo de aulas e ordenação)

---

## 📌 Status do Módulo da Bruna (Monitorado Automaticamente)

### ⚪ Passo 1: Tela de Login Simulado (`login.html` / `login.js`)
- [ ] `login.html` - Não criado
- [ ] `login.js` - Não criado

### ⚪ Passo 2: Catálogo de Cursos (`catalogo.html` / `catalogo.js`)
- [ ] `catalogo.html` - Não criado
- [ ] `catalogo.js` - Não criado

### ⚪ Passo 3: Página do Curso e Matrícula (`curso.html` / `curso.js`)
- [ ] `curso.html` - Não criado
- [ ] `curso.js` - Não criado

### ⚪ Passo 4: Perfil e Avaliações (`perfil.html` / `perfil.js` / `avaliacoes.js`)
- [ ] `perfil.html` - Não criado
- [ ] `perfil.js` - Não criado
- [ ] `avaliacoes.js` - Não criado

---

## 🔍 Registro de Checagens do Projeto
- **Última verificação:** 29/07/2026 10:43
- **Conclusão:** 100% dos módulos do escopo do Kauê foram desenvolvidos, validados e organizados nas subpastas `html/` e `js/`.
- **Pastas/Arquivos detectados fora do escopo do Kauê:**
  - `README.md` (criado na raiz)
  - `html/dashboard.html` (pasta `html` detectada)
