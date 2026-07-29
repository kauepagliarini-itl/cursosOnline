# Enunciado — Plataforma de Cursos Online (Roles, Validações e Múltiplos Endpoints)

## Contexto

Você deve desenvolver uma **plataforma de cursos online**, com backend simulado via `json-server`, contendo **pelo menos 6 endpoints** integrados. O sistema deve implementar **controle de acesso por perfil de usuário (roles)**, com **3 tipos de role**: usuário comum, usuário gerenciador de conteúdo e administrador.

---

## Endpoints

| Endpoint | Responsabilidade |
|---|---|
| **1. `usuarios`** | Cadastro de todos os usuários da plataforma (independente do role) |
| **2. `categorias`** | Categorias que agrupam os cursos (ex: Programação, Design, Marketing) |
| **3. `cursos`** | Cursos disponíveis na plataforma |
| **4. `aulas`** | Aulas que compõem cada curso |
| **5. `matriculas`** | Vínculo entre um usuário e um curso, incluindo progresso |
| **6. `avaliacoes`** | Notas e comentários deixados pelos alunos nos cursos que concluíram |

---

## Sistema de Roles

O campo `role` do usuário deve aceitar **apenas 3 valores possíveis**: `"aluno"`, `"editor"` ou `"admin"`.

### 1. Usuário comum (`aluno`)
- Pode visualizar cursos **publicados** e suas respectivas categorias e aulas.
- Pode se matricular em um curso (criação de registro em `matriculas`).
- Pode atualizar o próprio progresso na matrícula.
- Pode avaliar (nota + comentário) cursos em que já esteja com matrícula concluída.
- Pode editar apenas o **próprio** perfil (nome, senha) — não pode alterar seu `role`.
- **Não** tem acesso a: CRUD de cursos/aulas/categorias, listagem de outros usuários, dados de matrícula de terceiros.

### 2. Usuário gerenciador de conteúdo (`editor`)
- Tem todas as permissões do `aluno` como consumidor da plataforma (opcional, dependendo do fluxo escolhido).
- Pode criar, editar e excluir **cursos**, **aulas** e **categorias**.
- Pode visualizar as matrículas e avaliações **dos cursos que gerencia**, para acompanhar desempenho e engajamento.
- **Não** pode: gerenciar usuários (criar, editar, excluir, listar todos), nem alterar roles de ninguém.

### 3. Administrador (`admin`)
- Acesso total ao sistema.
- É o **único role com acesso ao CRUD de `usuarios`**: pode listar todos os usuários, criar, editar, excluir e **alterar o role de qualquer usuário**.
- Pode ativar/desativar contas (`ativo: true/false`).
- Herda todas as permissões de `editor` e `aluno`.

> ⚠️ **Nota técnica:** o `json-server` não possui autenticação/autorização nativa — qualquer requisição HTTP é permitida por padrão. Por isso, o controle de roles deve ser implementado na **camada de frontend**: um usuário "logado" (simulado, ex: guardado em contexto/estado global após um login fake) define quais rotas/telas/ações ficam visíveis e habilitadas. Documentar claramente essa limitação no README do projeto.

---

## Validações obrigatórias

### `usuarios`
- `nome`: obrigatório, mínimo 3 caracteres.
- `email`: obrigatório, formato válido, único na base.
- `senha`: obrigatório, mínimo 6 caracteres.
- `role`: obrigatório, deve ser exatamente `"aluno"`, `"editor"` ou `"admin"`.
- `ativo`: booleano, default `true`.

### `categorias`
- `nome`: obrigatório, único.

### `cursos`
- `titulo`: obrigatório, mínimo 5 caracteres.
- `categoriaId`: obrigatório, deve referenciar uma categoria existente.
- `instrutorId`: obrigatório, deve referenciar um usuário com `role: "editor"` (ou `"admin"`).
- `status`: obrigatório, apenas `"rascunho"` ou `"publicado"`.
- `cargaHoraria`: número positivo.

### `aulas`
- `cursoId`: obrigatório, deve referenciar um curso existente.
- `titulo`: obrigatório.
- `ordem`: número inteiro positivo (define a sequência da aula no curso).
- `duracaoMinutos`: número positivo.

### `matriculas`
- `usuarioId`: obrigatório, deve referenciar um usuário com `role: "aluno"`.
- `cursoId`: obrigatório, deve referenciar um curso com `status: "publicado"`.
- Não permitir matrícula duplicada (mesmo `usuarioId` + `cursoId`).
- `progresso`: número entre `0` e `100`.
- `status`: apenas `"em andamento"` ou `"concluído"`.

### `avaliacoes`
- `usuarioId` + `cursoId`: obrigatórios, e o usuário só pode avaliar se possuir matrícula com `status: "concluído"` para aquele curso.
- `nota`: obrigatório, número inteiro entre `1` e `5`.
- `comentario`: opcional, máximo 500 caracteres.
- Não permitir mais de uma avaliação do mesmo usuário para o mesmo curso.

---

## Telas sugeridas

- **Login (simulado)**: seleção/autenticação de um usuário existente, definindo o role ativo na sessão.
- **Catálogo de cursos**: visível a todos os roles, com filtro por categoria.
- **Página do curso**: lista de aulas, progresso (se matriculado) e avaliações.
- **Painel do editor**: CRUD de cursos, aulas e categorias, restrito a `editor`/`admin`.
- **Painel administrativo de usuários**: CRUD de usuários e alteração de roles, restrito a `admin`.
- **Meu perfil**: edição de dados próprios, disponível a todos os roles.

---

## Exemplo de item de cada endpoint

**`usuarios`**
```json
{
  "id": "u1a2b3",
  "nome": "Camila Rocha",
  "email": "camila.rocha@email.com",
  "senha": "senha123",
  "role": "aluno",
  "ativo": true
}
```

**`categorias`**
```json
{
  "id": "cat1x2",
  "nome": "Programação",
  "descricao": "Cursos sobre linguagens, frameworks e boas práticas de desenvolvimento."
}
```

**`cursos`**
```json
{
  "id": "cur1y3",
  "titulo": "Introdução ao JavaScript",
  "descricao": "Fundamentos da linguagem JavaScript para iniciantes.",
  "categoriaId": "cat1x2",
  "instrutorId": "u2c4d5",
  "status": "publicado",
  "cargaHoraria": 20
}
```

**`aulas`**
```json
{
  "id": "aul1z4",
  "cursoId": "cur1y3",
  "titulo": "Variáveis e Tipos de Dados",
  "conteudo": "https://video.exemplo.com/aula1",
  "ordem": 1,
  "duracaoMinutos": 15
}
```

**`matriculas`**
```json
{
  "id": "mat1w5",
  "usuarioId": "u1a2b3",
  "cursoId": "cur1y3",
  "dataMatricula": "2026-07-10T13:00:00Z",
  "progresso": 60,
  "status": "em andamento"
}
```

**`avaliacoes`**
```json
{
  "id": "ava1v6",
  "usuarioId": "u1a2b3",
  "cursoId": "cur1y3",
  "nota": 5,
  "comentario": "Curso muito claro e direto ao ponto, recomendo!",
  "data": "2026-07-20T18:45:00Z"
}
```
