(2/7) concluídas *Resolver instalação de dependências (pydantic-core)*

Perfeito — o servidor está rodando. O erro que você viu é porque `Invoke-RestMethod` é um cmdlet do PowerShell, não um comando do cmd.exe. Vou te mostrar formas simples e confiáveis de testar a API agora e os próximos passos práticos para integrar o frontend.

## Testes rápidos (escolha uma opção)

1) Usando PowerShell (recomendado)
```powershell
# (na PowerShell)
Invoke-RestMethod http://127.0.0.1:8000/ping
# deve retornar: @{status=ok} ou {"status":"ok"} dependendo do formato
```

2) Usando curl (funciona em cmd/PowerShell/WSL)
```powershell
curl http://127.0.0.1:8000/ping
```

3) Abrir no navegador
- Acesse: http://127.0.0.1:8000/ping  
- Ou abra a documentação automática do FastAPI em: http://127.0.0.1:8000/docs (UI interativa para testar endpoints)

## Testar criar usuário (exemplo)
PowerShell:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/users/ -Method POST -ContentType 'application/json' -Body '{"username":"teste","email":"teste@example.com","nome":"Teste","password":"senha123","tipo":"online"}'
```
curl:
```bash
curl -X POST http://127.0.0.1:8000/users/ -H "Content-Type: application/json" -d "{\"username\":\"teste\",\"email\":\"teste@example.com\",\"nome\":\"Teste\",\"password\":\"senha123\",\"tipo\":\"online\"}"
```

## Verificar dados locais
- O banco SQLite bancodados.db foi criado/populado por populate_db_sqlalchemy.py. Para inspecionar rapidamente:
  - Usar DB browser for SQLite, ou
  - No PowerShell com sqlite3 (se instalado):
    ```powershell
    sqlite3 bancodados.db
    sqlite> .tables
    sqlite> select id, username, email from auth_user limit 10;
    ```

## Conectar o frontend (Vite)
- Defina a URL da API no frontend (ex.: `.env.local` na raiz do seu projeto Vite):
```
VITE_API_URL="http://localhost:8000"
```
- Exemplo de fetch em React/TS:
```ts
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

await fetch(`${API}/users/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, nome, password, tipo })
});
```
- Se estiver desenvolvendo localmente com Vite, garanta que app.py tem CORS permitindo a origem do frontend (`localhost:5173` ou `localhost:3000`). Ajuste `allow_origins` em app.py se necessário.

## Parar o servidor
- No terminal onde o uvicorn está rodando: Ctrl+C

## Próximos passos sugeridos
- Testar os endpoints principais via `/docs`.
- Integrar um componente do frontend que consome users e `/users/{username}`.
- Se quiser, implemento endpoints REST adicionais (produtos, empresas, categorias) ou autenticação (JWT).

Quer que eu:
- rode aqui um teste `GET /ping` do workspace e te mostre o resultado, ou
- implemente um exemplo de chamada no frontend (componente React) apontando para sua API?