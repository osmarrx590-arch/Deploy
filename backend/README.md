# Backend (FastAPI) para Chope Pay Gateway

Passos rápidos para rodar localmente:

1. Criar e ativar um ambiente virtual (recomendado):
# Windows (PowerShell)

cd backend
python -m venv .venv   
.\.venv\Scripts\Activate.ps1
cd..
python -m uvicorn backend.main:app --reload --port 8000

# Se já foi criado
cd backend
.\.venv\Scripts\Activate.ps1
cd..
python -m uvicorn backend.main:app --reload --port 8000

2. Instalar dependências

   pip install -r requirements.txt

   ou

   python.exe -m pip install fastapi "uvicorn[standard]" SQLAlchemy requests python-dotenv pydantic 



# População do banco de dados (SQLite)

Este repositório contém modelos SQLAlchemy e um script utilitário para popular um banco SQLite de exemplo (`bancodados.db`).

Script principal:

- `populate_db_sqlalchemy.py` — cria categorias, empresas, notas fiscais, usuário `admin`, produtos de exemplo, mesas e movimentações de estoque. É idempotente.

Como rodar (Windows PowerShell):

1. Preparar ambiente e instalar dependências (na raiz do projeto):

```powershell
# Criar e ativar virtualenv (opcional)
python -m venv venv; .\venv\Scripts\Activate.ps1

"""Se der erro de política (ExecutionPolicy)
PowerShell pode bloquear scripts. Neste caso rode (apenas para a sessão atual — seguro):"""
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
. .\venv\Scripts\Activate.ps1

# Instalar dependências
pip install -r ..\requirements.txt
```
# Se der erro: 
Lista de tarefas pendentes atualizada

Boa — o log confirma o problema: mesmo com Rust presente, a construção de `pydantic-core` falhou no seu Python 3.13 (erro na geração do schema via script Python). A solução mais prática e estável é usar um venv com Python 3.12 (ou 3.11). Vou te passar passos claros (PowerShell) para criar um novo ambiente com Python 3.12 e instalar as dependências, com alternativas e o que colar aqui se algo falhar.

Resumo rápido
- Causa: incompatibilidade do processo de build do `pydantic-core` com seu CPython 3.13 na máquina; compilar em 3.13 está dando erro.
- Solução recomendada: criar um venv com Python 3.12 e reinstalar dependências (evita compilar pydantic-core do zero na maioria dos casos).
- Alternativa: tentar ajustar / forçar versões ou continuar depurando o build do pydantic-core (mais trabalho).

Passos recomendados (PowerShell)

1) Verificar se você tem o launcher `py` e que versões do Python estão instaladas
```powershell
py -0p
# lista as instalações do Python que o launcher conhece
# ou tente:
py -3.12 --version
py -3.11 --version
```
Se `py -3.12` não existir, instale o Python 3.12 (próximo passo).

2) Instalar Python 3.12 (se necessário)
- Via winget (se disponível):
```powershell
winget install --id=Python.Python.3.12 -e
```
- Ou baixar e executar instalador de https://www.python.org/downloads/release/python-312x/ (escolha o instalador para Windows e marque “Add to PATH” ou use o `py` launcher).

3) Apagar o venv atual e recriar com Python 3.12
- Remover o venv antigo:
```powershell
# estando em D:\Python\Choperia\backend
Remove-Item -Recurse -Force .\venv
# ou, se preferir:
rmdir /s /q .\venv
```

- Criar novo venv com Python 3.12 usando o launcher `py` (recomendado):
```powershell
# estando em D:\Python\Choperia\backend
py -3.12 -m venv .\venv
```
Se preferir usar um executável específico (ex: instalado em C:\Python312\python.exe):
```powershell
C:\Path\To\python3.12.exe -m venv .\venv
```

4) Ativar o novo venv
```powershell

Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
. .\venv\Scripts\Activate.ps1

ou já com o venv

D:/OsmarSoftware/happy-hops-home/.venv/Scripts/python.exe -m uvicorn backend.app:app --reload --port 8000

```
Verifique o python do venv:
```powershell
python --version   # deve mostrar Python 3.12.x
python -c "import sys; print(sys.executable)"
```

5) Atualizar pip e instalar dependências
```powershell
python -m pip install --upgrade pip setuptools wheel
pip install -r ..\requirements.txt
```
- Se tudo correr bem, verá “Successfully installed …” no final.

6) Criar / popular DB e rodar servidor
# a partir de D:\Python\Choperia
# define o diretório atual (raiz do repo) como pacote importável
$env:PYTHONPATH = (Get-Location).Path
python .\backend\populate_db_sqlalchemy.py

# Subir a API (do root):
cd ..
python -m uvicorn backend.app:app --reload --port 8000
```
Testar:
```powershell
Invoke-RestMethod http://127.0.0.1:8000/ping
# deve retornar: {"status":"ok"}
```

O que fazer se o pip ainda falhar (após recriar com 3.12)
- Cole aqui a saída completa do erro. Normalmente o erro desaparece com venv em 3.12, mas se houver erro de linker/MSVC instale Visual C++ Build Tools:
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e
# ou baixe em https://visualstudio.microsoft.com/visual-cpp-build-tools/
```
Depois reinicie o shell, ative o venv e repita o `pip install`.

Por que recomendo Python 3.12
- Para muitas bibliotecas compiladas (pydantic-core, pyo3 bindings), ainda há melhor compatibilidade com 3.11/3.12. Evita compilar código complexo no seu PC e reduz chances de erro.



2. Criar as tabelas e popular o banco, se desejar:

```powershell
python .\populate_db_sqlalchemy.py
```

3. Executar a API (FastAPI + Uvicorn):

```powershell
# A partir da raiz do projeto
python -m uvicorn backend.app:app --reload --port 8000
```

Endpoints úteis:

- GET /ping — checa status
- POST /users/ — criar usuário (body JSON {username, email, nome, password, tipo})
- GET /users/{username} — buscar usuário
- DELETE /users/{username} — deletar usuário

O frontend pode consumir esses endpoints apontando para http://localhost:8000. Ajuste CORS em `backend/app.py` se o frontend estiver em outra origem.

Notas:

- O script usa os modelos definidos em `core_models.py`, `fisica_models.py` e `user_models.py`.
- Usuário criado por padrão: `admin` (senha `admin123`). Altere conforme necessário em produção.
- Se quiser popular com mais produtos, edite `PRODUTOS_SAMPLE` no script ou solicite que eu importe a lista completa.

## Integração Mercado Pago (ambiente de teste)

O backend já expõe o endpoint POST `/mp/create_preference/` que encaminha a requisição para a API do Mercado Pago.

Para usar em modo de teste (sandbox) faça o seguinte:

1. Obtenha o Access Token de teste (Sandbox) no painel do Mercado Pago:
    - Acesse https://developers.mercadopago.com.br/ e faça login com a conta de teste.
    - Vá em "Credenciais" (Credentials) e copie o Access Token (TEST-...).

2. Defina a variável de ambiente no PowerShell antes de iniciar o servidor:

```powershell
$env:MERCADO_PAGO_ACCESS_TOKEN = "TEST-SEU_TOKEN_AQUI"
python -m uvicorn backend.main:app --reload --port 8000
```

Ou para persistir no Windows (abre uma nova sessão do shell depois):

```powershell
setx MERCADO_PAGO_ACCESS_TOKEN "TEST-SEU_TOKEN_AQUI"
```

3. (Frontend) aponte `VITE_BACKEND_URL` para `http://localhost:8000` criando um arquivo `.env.local` na raiz do projeto com:

```
VITE_BACKEND_URL=http://localhost:8000
```

4. Teste rapidamente o endpoint com PowerShell (exemplo):

```powershell
$body = @{ 
   items = @(@{ title = 'Teste'; unit_price = 10; quantity = 1 }),
   back_urls = @{ success = 'http://localhost:5173/loja-online/historico?payment=success'; failure = 'http://localhost:5173/loja-online/checkout?payment=failure'; pending = 'http://localhost:5173/loja-online/historico?payment=pending' },
   auto_return = 'approved',
   external_reference = 'teste-123'
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri http://localhost:8000/mp/create_preference/ -Method Post -Body $body -ContentType 'application/json'
```

A resposta deve conter `init_point` e `sandbox_init_point`. O frontend já usa `sandbox_init_point || init_point` para redirecionar.

Observação: nunca comite o token no repositório. Use variáveis de ambiente.
