"""
Script para corrigir senhas no banco de dados.
Rehash todas as senhas usando bcrypt corretamente.
"""
import sys
from pathlib import Path

# Adiciona o diretório pai ao path para importar os módulos
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir.parent))

from backend.database import SessionLocal
from backend.models import User
import bcrypt # Biblioteca para hashing de senhas

def fix_passwords():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"📋 Encontrados {len(users)} usuários no banco de dados\n")
        
        for user in users:
            print(f"👤 Usuário: {user.nome} ({user.email})")
            
            # Define uma senha padrão para todos (você pode mudar depois no login)
            default_password = "123456"
            
            # Gera o hash correto
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(default_password.encode('utf-8'), salt).decode('utf-8')
            
            # Atualiza a senha
            user.password = hashed
            
            print(f"   ✅ Senha resetada para: {default_password}\n")
        
        db.commit()
        print("✅ Todas as senhas foram corrigidas!")
        print("⚠️  Senha padrão para todos os usuários: 123456")
        print("   Faça login e altere sua senha após o primeiro acesso.")
        
    except Exception as e:
        print(f"❌ Erro ao corrigir senhas: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_passwords()
