# 🎓 EduPlat — Plataforma de Cursos Online

Plataforma web para gestão e consumo de cursos online, com **controle de acesso por perfil (roles)**, catálogo de cursos, matrículas, avaliações, relatórios administrativos e recursos de acessibilidade. Projeto acadêmico construído em **HTML, CSS e JavaScript puro** no frontend, com **json-server** simulando a API REST no backend.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![json-server](https://img.shields.io/badge/json--server-000000?style=flat&logo=json&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## 📋 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Sistema de perfis (roles)](#-sistema-de-perfis-roles)
- [Limitação de segurança conhecida](#️-limitação-de-segurança-conhecida)
- [Tecnologias utilizadas](#-tecnologias-utilizadas)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Como rodar o projeto](#-como-rodar-o-projeto)
- [Contas de demonstração](#-contas-de-demonstração)
- [Endpoints da API](#-endpoints-da-api)
- [Acessibilidade](#-acessibilidade)
- [Autoria](#-autoria)

---

## 📖 Sobre o projeto

O **EduPlat** simula uma plataforma real de ensino online (nos moldes de Udemy/Alura), permitindo que **alunos** se matriculem e avaliem cursos, **editores** produzam conteúdo (cursos, aulas e categorias) e **administradores** tenham controle total do sistema, incluindo gestão de usuários e relatórios.

Como não há um backend próprio, os dados são servidos por um [`json-server`](https://github.com/typicode/json-server) local, que transforma o arquivo [`db.json`](./db.json) em uma API REST completa. Todo o controle de autenticação, sessão e permissões é feito **no frontend**.

O escopo funcional completo do projeto está detalhado em [`Enunciado.md`](./Enunciado.md).

## ✨ Funcionalidades

- **Login simulado** com sessão persistida (`localStorage`/`sessionStorage`) e opção "lembrar-me".
- **Catálogo de cursos** com filtro por categoria, busca e página de detalhes com aulas e avaliações.
- **Matrícula e progresso**: o aluno se matricula, acompanha o progresso e avalia cursos concluídos.
- **Painel do editor**: CRUD completo de cursos, aulas e categorias.
- **Painel administrativo**: CRUD de usuários, ativação/desativação de contas e alteração de perfil (role).
- **Relatórios gerenciais**: estatísticas da plataforma, exportação em **Excel (.xlsx)**, **CSV** e **XML**, envio por e-mail (simulado) e histórico de extrações/envios.
- **Acessibilidade nativa**: modo daltonismo, leitura facilitada (dislexia), controle de tamanho de fonte, tradução em Libras (VLibras) e aviso de LGPD.

## 🔐 Sistema de perfis (roles)

O campo `role` de cada usuário aceita exatamente um dentre três valores:

| Perfil | O que pode fazer |
|---|---|
| **`aluno`** | Ver cursos publicados, matricular-se, acompanhar progresso, avaliar cursos concluídos e editar o próprio perfil. |
| **`editor`** | Tudo que o aluno pode, **+** CRUD de cursos, aulas e categorias, e visualização de matrículas/avaliações dos cursos que gerencia. |
| **`admin`** | Acesso total: herda tudo do `editor`, **+** CRUD completo de usuários, alteração de roles, ativação/desativação de contas e relatórios gerenciais. |

A verificação de perfil acontece em cada tela protegida via `exigirRole(...)` / `exigirAutenticacao(...)` (ver [`assets/js/auth.js`](./assets/js/auth.js)), redirecionando usuários sem permissão.

## ⚠️ Limitação de segurança conhecida

> **Importante:** o `json-server` **não possui autenticação/autorização nativa** — qualquer requisição HTTP feita diretamente à API (ex: via Postman ou `fetch` no console) é aceita, independentemente de "quem está logado".
>
> Todo o controle de acesso por role descrito acima existe **apenas na camada de frontend** (esconder telas/botões e redirecionar usuários), como uma simulação didática de autorização. **Isso não é adequado para produção.** Em um cenário real, essas regras precisariam ser reforçadas por um backend com autenticação (ex: JWT) e autorização no servidor.

## 🛠 Tecnologias utilizadas

- **HTML5 / CSS3 / JavaScript (Vanilla)** — sem frameworks de UI, sem build step.
- **[Tailwind CSS](https://tailwindcss.com/)** (via CDN) para estilização utilitária.
- **[json-server](https://github.com/typicode/json-server)** simulando a API REST (`db.json`).
- **[SweetAlert2](https://sweetalert2.github.io/)** para modais e alertas.
- **[SheetJS (xlsx)](https://sheetjs.com/)** para exportação de relatórios em Excel.
- **[Vanta.js](https://www.vantajs.com/) / Three.js** para os fundos animados.
- **[VLibras](https://vlibras.gov.br/)** (widget oficial do governo federal) para tradução em Libras.

## 📁 Estrutura de pastas

```
cursosOnline/
├── html/              # Todas as páginas da aplicação (login, catálogo, painéis...)
├── assets/
│   ├── js/            # Um arquivo JS por tela/módulo (ex: cursos.js, auth.js, api.js)
│   └── css/           # Estilos customizados (style.css)
├── img/                # Ícones e imagens estáticas
├── db.json             # "Banco de dados" consumido pelo json-server
├── ligarJsonServer.bat  # Atalho para subir o backend simulado no Windows
├── package.json
└── Enunciado.md         # Especificação funcional completa do projeto
```

Cada tela HTML carrega apenas os scripts que precisa; utilitários como `api.js` (chamadas HTTP), `auth.js` (sessão/roles) e `shell.js` (topbar/sidebar das telas internas) são compartilhados entre várias páginas.

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (para rodar o `json-server`)
- Um servidor local para o frontend — **não abra os arquivos `.html` direto pelo disco** (`file://`), pois o navegador bloqueia as requisições à API. Use a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) do VS Code, ou o pacote [`serve`](https://www.npmjs.com/package/serve).

### Passo a passo

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone <url-do-repositorio>
   cd cursosOnline
   npm install
   ```

2. **Suba o backend simulado (json-server), em um terminal:**
   ```bash
   npm run server
   ```
   Isso inicia a API em `http://localhost:3000`. No Windows, também é possível usar o atalho `ligarJsonServer.bat`.

3. **Sirva o frontend, em outro terminal (ou via Live Server no VS Code):**
   ```bash
   npx serve .
   ```

4. **Acesse a aplicação** pela URL informada pelo `serve` (normalmente `http://localhost:3000` do próprio pacote `serve`, que é diferente da porta do json-server — confira a porta exibida no terminal) e faça login com uma das [contas de demonstração](#-contas-de-demonstração).

> 💡 A tela avisa automaticamente, com um banner no topo, caso perceba que foi aberta via `file://` em vez de um servidor HTTP.

## 👤 Contas de demonstração

O arquivo `db.json` já vem populado com usuários de teste para cada perfil. Exemplos:

| Perfil | E-mail | Senha |
|---|---|---|
| Aluno | `camila.rocha@email.com` | `senha123` |
| Editor | `eduardo.lima@email.com` | `senha123` |

> Para testar como **administrador**, consulte/edite diretamente os registros com `"role": "admin"` em `db.json`, ou promova um usuário existente pelo painel administrativo usando uma conta admin já cadastrada.

## 🔌 Endpoints da API

Servidos automaticamente pelo `json-server` a partir de `db.json`, em `http://localhost:3000`:

| Endpoint | Responsabilidade |
|---|---|
| `/usuarios` | Cadastro de todos os usuários da plataforma |
| `/categorias` | Categorias que agrupam os cursos |
| `/cursos` | Cursos disponíveis na plataforma |
| `/aulas` | Aulas que compõem cada curso |
| `/matriculas` | Vínculo entre usuário e curso, com progresso |
| `/avaliacoes` | Notas e comentários dos alunos |
| `/logsRelatorios` | Histórico de extrações/envios de relatórios administrativos |

As regras de validação de cada entidade (campos obrigatórios, unicidade, referências entre coleções etc.) estão detalhadas em [`Enunciado.md`](./Enunciado.md).

## ♿ Acessibilidade

O menu de acessibilidade (ícone no cabeçalho, disponível em todas as telas) oferece:

- Controle de **tamanho de fonte** (A- / A / A+).
- **Modo daltonismo**, que ajusta paletas de cor sensíveis (verde/vermelho → azul/laranja).
- **Leitura facilitada** para dislexia (tipografia e espaçamento ajustados).
- **Tradução em Libras** via widget oficial [VLibras](https://vlibras.gov.br/).
- Aviso de **privacidade e proteção de dados (LGPD)**.

## ✍️ Autoria

Projeto acadêmico desenvolvido por:

- **Bruna Coelho**
- **Kaue Pagliarini**
