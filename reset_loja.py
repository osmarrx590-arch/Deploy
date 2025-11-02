import os
import subprocess

'''
Para executar o script, abra um terminal, navegue até o diretório onde o script está salvo e execute:
python reset_loja.py
'''

# Definir caminhos
backend_dir = os.path.abspath('backend')  # Caminho absoluto do backend
loja_dir = os.path.join(backend_dir, 'loja')
db_path = os.path.join(loja_dir, 'db.sqlite3')

# Função para remover migrações
def remover_migracoes(loja_dir):
    if not os.path.exists(loja_dir):
        print(f"❌ Diretório não encontrado: {loja_dir}")
        return

    for root, dirs, files in os.walk(loja_dir):
        if 'migrations' in dirs:
            migrations_dir = os.path.join(root, 'migrations')
            for file in os.listdir(migrations_dir):
                file_path = os.path.join(migrations_dir, file)
                if os.path.isfile(file_path) and file not in ('__init__.py', '__pycache__'):
                    try:
                        os.remove(file_path)
                        print(f'✅ Removido: {file_path}')
                    except PermissionError:
                        print(f'❌ Permissão negada: {file_path}')
            print(f'🗑️ Migrações removidas em: {migrations_dir}')

# Função para executar comandos do Django
def executar_comandos_django():
    try:
        # Mudar para o diretório backend
        os.chdir(backend_dir)
        print(f'📁 Diretório alterado para: {backend_dir}')

        # Ativar o ambiente virtual
        activate_script = os.path.join(backend_dir, 'venv', 'Scripts', 'activate.bat' if os.name == 'nt' else 'activate')
        if not os.path.exists(activate_script):
            print('❌ Ambiente virtual não encontrado!')
            return

        # Lista de comandos a serem executados
        comandos = [
            'venv\\Scripts\\activate && cd loja && python manage.py makemigrations',
            'venv\\Scripts\\activate && cd loja && python manage.py migrate',
            # Criar superusuário usando shell
            'venv\\Scripts\\activate && cd loja && echo from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser("admin", "admin@gmail.com", "2325*-9+") | python manage.py shell',
            'venv\\Scripts\\activate && cd loja && python produto/scripts/populate_db.py',
            'venv\\Scripts\\activate && cd loja && python manage.py runserver 8004'
        ]

        # Executar cada comando
        for cmd in comandos:
            print(f'🚀 Executando: {cmd}')
            # Usar shell=True para interpretar os comandos corretamente
            process = subprocess.run(cmd, shell=True, text=True, capture_output=True)
            
            if process.returncode == 0:
                print(f'✅ Comando executado com sucesso:\n{process.stdout}')
            else:
                print(f'❌ Erro ao executar comando:\n{process.stderr}')
                break

    except Exception as e:
        print(f'❌ Erro durante a execução: {str(e)}')

# Remover migrações
remover_migracoes(loja_dir)

# Remover banco de dados SQLite, se existir
if os.path.exists(db_path):
    os.remove(db_path)
    print(f'🗑️ Banco de dados removido: {db_path}')
else:
    print('ℹ️ Nenhum banco de dados para remover.')

# Executar os comandos Django
executar_comandos_django()