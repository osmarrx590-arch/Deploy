#!/usr/bin/env python3
"""
Script leve para checagem de tipos TypeScript.

Uso:
    python typecheck.py

Comportamento:
- Tenta executar `npx tsc --noEmit` se o `npx` estiver disponível.
- Se não, tenta usar um `tsc` global no PATH.
- Se não houver, tenta `node_modules/.bin/tsc(.cmd)` no workspace.
- Encaminha a saída para o console e retorna o mesmo código de saída do processo tsc.
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

def find_local_tsc():
    # node_modules/.bin/tsc(.cmd on Windows)
    bin_dir = os.path.join(ROOT, 'node_modules', '.bin')
    if os.name == 'nt':
        candidate = os.path.join(bin_dir, 'tsc.cmd')
    else:
        candidate = os.path.join(bin_dir, 'tsc')
    if os.path.exists(candidate) and os.access(candidate, os.X_OK):
        return candidate
    return None


def main():
    print('Verificação de tipos: iniciando checagem TypeScript (tsc --noEmit)')

    npx = shutil.which('npx')
    tsc_global = shutil.which('tsc')
    tsc_local = find_local_tsc()

    cmd = None
    if npx:
        cmd = [npx, 'tsc', '--noEmit']
        print('Usando npx para executar o tsc')
    elif tsc_global:
        cmd = [tsc_global, '--noEmit']
        print('Usando tsc global disponível no PATH')
    elif tsc_local:
        cmd = [tsc_local, '--noEmit']
        print(f'Usando tsc local em: {tsc_local}')
    else:
        print('\nErro: compilador TypeScript não encontrado.')
        print('Instale-o com:')
        print('  npm install --save-dev typescript')
        print('ou assegure que o `npx` esteja disponível no PATH.')
        return 2

    try:
        # Run the command and stream output
        process = subprocess.run(cmd, cwd=ROOT)
        rc = process.returncode
        if rc == 0:
            print('\nVerificação: OK (nenhum erro de tipo)')
        else:
            print(f'\nVerificação: FALHA (código de saída {rc})')
        return rc
    except KeyboardInterrupt:
        print('\nVerificação: interrompida pelo usuário')
        return 130
    except Exception as e:
        print('\nVerificação: erro inesperado:', e)
        return 3

if __name__ == '__main__':
    sys.exit(main())
