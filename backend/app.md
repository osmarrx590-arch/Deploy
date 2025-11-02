## Explicação dos Endpoints

### Categorias
- `POST /categorias/`: Cria uma nova categoria. Recebe nome e descrição.
- `GET /categorias/`: Lista todas as categorias cadastradas.
- `GET /categorias/{cat_id}`: Busca uma categoria pelo id.
- `PUT /categorias/{cat_id}`: Atualiza os dados de uma categoria existente.
- `DELETE /categorias/{cat_id}`: Remove uma categoria pelo id.

### Empresas
- `POST /empresas/`: Cria uma nova empresa. Recebe dados como nome, endereço, telefone, email, cnpj e slug.
- `GET /empresas/`: Lista todas as empresas cadastradas.
- `GET /empresas/{emp_id}`: Busca uma empresa pelo id.
- `PUT /empresas/{emp_id}`: Atualiza os dados de uma empresa existente.
- `DELETE /empresas/{emp_id}`: Remove uma empresa pelo id.

### Produtos
- `POST /produtos/`: Cria um novo produto. Recebe dados como nome, categoria, empresa, descrição, custo, venda, código, estoque, disponibilidade, imagem e slug.
- `GET /produtos/`: Lista todos os produtos cadastrados, com limite opcional.
- `GET /produtos/codigo/{codigo}`: Busca um produto pelo código.
- `PUT /produtos/{prod_id}`: Atualiza os dados de um produto existente.
- `DELETE /produtos/{prod_id}`: Remove um produto pelo id.

### Usuários
- `POST /users/`: Cria um novo usuário. Recebe username, email, nome, senha e tipo.
- `GET /users/{username}`: Busca um usuário pelo username.
- `DELETE /users/{username}`: Remove um usuário pelo username.

### Autenticação
- `POST /auth/login`: Realiza login do usuário via email e senha. Retorna dados do usuário e define cookie de autenticação.
- `POST /auth/register`: Realiza cadastro de novo usuário. Se o email já existir, retorna erro. Após cadastro, faz login automático.
- `GET /auth/me`: Retorna os dados do usuário autenticado (usando JWT do cookie ou header). Se não autenticado, retorna erro 401.
- `POST /auth/logout`: Efetua logout do usuário, removendo o cookie de autenticação.

### Outros
- `GET /ping`: Endpoint de saúde. Retorna `{ "status": "ok" }` para indicar que o backend está online.
# Explicação do arquivo backend/app.py

Este arquivo implementa a API principal do backend usando FastAPI. Ele organiza endpoints para autenticação, usuários, empresas, produtos e categorias, além de configurar middlewares e permissões CORS. Abaixo está uma explicação detalhada, bloco a bloco, no mesmo estilo da explicação anterior:

---

## 1. Imports e Inicialização
- Importa módulos do FastAPI, Pydantic, JWT, datetime, e funções dos arquivos de modelos e views.
- Cria a instância principal do FastAPI: `app = FastAPI(title="Choperia Backend API")`

## 2. Middleware de Logging
- O middleware `log_requests` registra cada requisição HTTP recebida e o tempo de resposta, útil para depuração.

## 3. CORS
- Configura CORS para permitir requisições do frontend (origens locais e remotas), aceitando todos os métodos e headers.

## 4. Modelos de Usuário
- `UserCreate` e `UserOut` são modelos Pydantic para entrada e saída de dados de usuário.

## 5. Endpoints de Categoria
- CRUD completo para categorias:
  - `POST /categorias/`: cria uma categoria
  - `GET /categorias/`: lista todas
  - `GET /categorias/{cat_id}`: busca por id
  - `PUT /categorias/{cat_id}`: atualiza
  - `DELETE /categorias/{cat_id}`: remove

## 6. Endpoints de Empresa
- CRUD completo para empresas:
  - `POST /empresas/`: cria empresa
  - `GET /empresas/`: lista todas
  - `GET /empresas/{emp_id}`: busca por id
  - `PUT /empresas/{emp_id}`: atualiza
  - `DELETE /empresas/{emp_id}`: remove

## 7. Endpoints de Produto
- CRUD completo para produtos:
  - `POST /produtos/`: cria produto
  - `GET /produtos/`: lista produtos (com limite)
  - `GET /produtos/codigo/{codigo}`: busca por código
  - `PUT /produtos/{prod_id}`: atualiza
  - `DELETE /produtos/{prod_id}`: remove

## 8. Endpoint de Saúde
- `GET /ping`: retorna `{"status": "ok"}` para verificar se o backend está online.

## 9. Endpoints de Usuário
- `POST /users/`: cria usuário
- `GET /users/{username}`: busca usuário por username
- `DELETE /users/{username}`: remove usuário

## 10. Inicialização do Servidor
- Se rodar como script principal, inicia o servidor Uvicorn em modo de recarga.

## 11. Endpoints de Autenticação
- Modelos `LoginIn` e `RegisterIn` para login e registro.
- `POST /auth/login`: autentica usuário por email e senha, gera JWT, retorna dados e cookie de sessão.
- `POST /auth/register`: registra novo usuário, verifica se email já existe, cria usuário, faz login automático, retorna dados e cookie.
- Função auxiliar `get_user_from_token(request)`:
  - Extrai token JWT do cookie ou header
  - Decodifica e valida
  - Busca usuário pelo id do token
- `GET /auth/me`: retorna dados do usuário autenticado (id, username, email, nome, tipo, datas de criação/atualização). Se não autenticado, retorna erro 401.
- `POST /auth/logout`: remove cookie de autenticação, efetua logout.

---

## Resumo
Este arquivo define toda a API REST do backend, incluindo autenticação JWT, CRUD de entidades principais (usuário, empresa, produto, categoria), configuração de CORS e logging. Cada endpoint segue boas práticas REST e retorna respostas padronizadas, facilitando o consumo pelo frontend.

Ideal para aplicações web que precisam de autenticação, gerenciamento de usuários, produtos e empresas, com integração fácil via HTTP/JSON.
Este é um endpoint da API FastAPI que retorna as informações do usuário atualmente autenticado. Vou explicar em detalhes:

1. `@app.get('/auth/me')` é um decorador que cria uma rota HTTP GET no endpoint `/auth/me`

2. Quando um cliente faz uma requisição GET para esta rota:
   - O sistema verifica o token de autenticação (JWT) que está nos cookies ou no cabeçalho da requisição
   - Se o usuário estiver autenticado, retorna os dados do usuário como:
     - id
     - username
     - email
     - nome
     - tipo (online, fisica ou admin)
     - created_at (data de criação)
     - updated_at (data de atualização)

3. Se o usuário não estiver autenticado (sem token ou token inválido), retorna um erro 401 (Not authenticated)

Este endpoint é comumente usado em aplicações web para:
- Verificar se o usuário está logado
- Obter os dados do usuário atual
- Validar a sessão do usuário
- Mostrar informações do perfil do usuário

Por exemplo, quando você abre uma aplicação que já estava logada anteriormente, o frontend geralmente faz uma chamada para `/auth/me` para recuperar os dados do usuário e confirmar que a sessão ainda é válida.