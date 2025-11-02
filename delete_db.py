import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Apagar arquivo bancodados.db com confirmação.")
    parser.add_argument("--path", "-p", default="bancodados.db", help="Caminho para o arquivo de banco (padrão: bancodados.db)")
    parser.add_argument("--yes", "-y", action="store_true", help="Não pedir confirmação")
    parser.add_argument("--force", "-f", action="store_true", help="Permitir apagar arquivo cujo nome não seja 'bancodados.db'")
    args = parser.parse_args()

    target = Path(args.path).resolve()

    if not target.exists():
        print(f"Arquivo não encontrado: {target}")
        sys.exit(1)
    if not target.is_file():
        print(f"Não é um arquivo: {target}")
        sys.exit(1)
    if target.name != "bancodados.db" and not args.force:
        print(f"Atenção: o arquivo alvo é '{target.name}'. Use --force para confirmar remoção de outro arquivo.")
        sys.exit(1)

    if not args.yes:
        resp = input(f"Confirma apagar '{target}'? [y/N]: ").strip().lower()
        if resp not in ("y", "s", "yes", "sim"):
            print("Operação cancelada.")
            sys.exit(0)

    try:
        target.unlink()
        print(f"Arquivo apagado: {target}")
    except Exception as e:
        print(f"Erro ao apagar o arquivo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()