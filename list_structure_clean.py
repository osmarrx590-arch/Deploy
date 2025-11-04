import os

def list_files(startpath, prefix=''):
    ignore_dirs = {'venv', '__pycache__', 'node_modules', '.git', 'ui', 'dist', 'build'}
    ignore_extensions = {'.jpg', '.png', '.pyc', '.log', '.env'}

    for item in sorted(os.listdir(startpath)):
        path = os.path.join(startpath, item)
        
        # Ignora diretórios específicos
        if os.path.isdir(path) and item in ignore_dirs:
            continue
        
        # Ignora arquivos com extensões específicas
        if os.path.isfile(path) and any(item.endswith(ext) for ext in ignore_extensions):
            continue
        
        if os.path.isdir(path):
            print(f"{prefix}├── {item}/")
            list_files(path, prefix + '│   ')
        else:
            print(f"{prefix}├── {item}")

print("Estrutura do Projeto:")
print(".")
list_files('.')

# para executar: python list_structure_clean.py

"""def list_files(startpath, prefix=''):
    for item in sorted(os.listdir(startpath)):
        if item in ['venv', '__pycache__', ] or item.endswith(('.jpg', '.png')):  # Ignora as pastas venv, __pycache__ e arquivos .jpg e .png
            continue
        path = os.path.join(startpath, item)
        if os.path.isdir(path):
            print(f"{prefix}├── {item}/")
            list_files(path, prefix + '│   ')
        else:
            print(f"{prefix}├── {item}")
            
print(".")
list_files('.')"""


# código para rodar
# py list_structure_clean.py
"""




"""