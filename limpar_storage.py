#!/usr/bin/env python3
"""
limpar_storage.py

Script para abrir uma URL (padrão http://localhost:8080) e limpar o localStorage do origin.

Requisitos:
  pip install playwright
  playwright install

Uso:
  python limpar_storage.py --url http://localhost:8080

Opções:
  --url    URL da aplicação (default: http://localhost:8080)
  --headful  Abrir browser visível para depuração (default: False)

O script usa Playwright para navegar até a URL e executa:
  localStorage.clear()
Caso haja falha, também tenta remover uma lista de chaves conhecidas do projeto.
"""
import argparse
import asyncio
import sys
from typing import List

KNOWN_KEYS: List[str] = [
    'usuario_logado','users','produtos_cadastrados','movimentacoes_estoque',
    'categorias_cadastradas','mesas_salvas','mesa_events','pedidos_locais',
    'pedidos_historico','contador_pedidos','data_contador_pedidos',
    'empresas_salvas','carrinho_items','cupom','favoritos_items','avaliacoes_items'
]


async def clear_storage(url: str, headful: bool) -> int:
    try:
        # Import dynamically to avoid static-analysis false positives when Playwright
        # is not installed in the editor environment.
        import importlib
        mod = importlib.import_module('playwright.async_api')
        async_playwright = getattr(mod, 'async_playwright')
    except Exception as e:
        print('Playwright não está instalado. Rode: pip install playwright', file=sys.stderr)
        return 2

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=not headful)
        context = await browser.new_context()
        page = await context.new_page()
        try:
            print(f'Abrindo {url}')
            await page.goto(url, wait_until='domcontentloaded', timeout=15000)

            # Try full clear
            print('Executando localStorage.clear()')
            ok = await page.evaluate('''() => {
                try { localStorage.clear(); return true; } catch (e) { return false; }
            }''')
            if ok:
                print('localStorage.clear() executado com sucesso.')
            else:
                print('localStorage.clear() falhou — tentando remover chaves conhecidas')
                import json
                keys_json = json.dumps(KNOWN_KEYS)
                await page.evaluate(f'''() => {{ const keys = {keys_json}; keys.forEach(k => localStorage.removeItem(k)); }}''')
                print('Remoção de chaves conhecidas executada.')

            # Optionally try to call window.clearLocalStorage if present
            helper_exists = await page.evaluate("() => typeof window.clearLocalStorage === 'function'")
            if helper_exists:
                print('window.clearLocalStorage encontrado — chamando helper')
                await page.evaluate("() => window.clearLocalStorage()")

            await browser.close()
            return 0
        except Exception as err:
            print('Erro durante a limpeza do storage:', err, file=sys.stderr)
            try:
                await browser.close()
            except Exception:
                pass
            return 1


def main() -> int:
    parser = argparse.ArgumentParser(description='Limpar localStorage de uma aplicação web usando Playwright.')
    parser.add_argument('--url', default='http://localhost:8080', help='URL da aplicação (default: http://localhost:8080)')
    parser.add_argument('--headful', action='store_true', help='Abrir navegador visível para depuração')
    args = parser.parse_args()

    return asyncio.run(clear_storage(args.url, args.headful))


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
