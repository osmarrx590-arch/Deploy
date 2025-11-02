"""
Modelo de usuário usando SQLAlchemy, convertido do Django AbstractUser.
Inclui campos personalizados e choices para tipo de usuário.
"""

from sqlalchemy import Column, String, DateTime, Enum, Integer, Boolean
from sqlalchemy.sql import func # Importa func para valores padrão de data/hora
import enum # Enumeração para tipos de usuário
import bcrypt # Biblioteca para hashing de senhas

# Reutiliza engine, Session e Base do core_models para usar a mesma metadata
from backend.core_models import db, Session, Base
from backend.logging_config import logger

# Enum para tipos de usuário
class UserType(enum.Enum):
    online = 'Online'
    fisica = 'Fisica'
    admin = 'Administrator'

class User(Base):
    __tablename__ = "auth_user"

    # Campos principais
    id = Column("id", Integer, primary_key=True, autoincrement=True)
    username = Column("username", String(150), unique=True, nullable=False)
    email = Column("email", String(255), unique=True, nullable=False)
    nome = Column("nome", String(150), nullable=False)
    
    # Senha e campos de autenticação
    password = Column("password", String(128), nullable=False)
    is_active = Column("is_active", Boolean, default=True)
    is_superuser = Column("is_superuser", Boolean, default=False)
    
    # Campos de tipo de usuário
    tipo = Column("tipo", Enum(UserType), default=UserType.online)
    
    # Campos de data
    created_at = Column("created_at", DateTime, server_default=func.now())
    updated_at = Column("updated_at", DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column("last_login", DateTime, nullable=True)
    date_joined = Column("date_joined", DateTime, server_default=func.now())

    def __init__(self, username, email, nome, password, tipo=UserType.online):
        self.username = username
        self.email = email
        self.nome = nome
        self.set_password(password)  # Usa o método set_password para criar o hash
        self.tipo = tipo  # Mantendo sincronizado com tipo
        self.is_active = True
        self.is_superuser = False

    def __repr__(self):
        return f"User(nome={self.nome}, email={self.email}, tipo={self.tipo.value}, password={self.password})"

    def __str__(self):
        return f"{self.nome} ({self.email})"

    def set_password(self, password):
        """Gera um hash da senha usando bcrypt"""
        # Converte a senha para bytes se for string
        if isinstance(password, str):
            password = password.encode('utf-8')
        # Gera o salt e o hash
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(password, salt).decode('utf-8')

    def check_password(self, password):
        """Verifica se a senha está correta"""
        # Converte a senha para bytes se for string
        if isinstance(password, str):
            password = password.encode('utf-8')
        # Converte o hash armazenado de string para bytes
        stored_password = self.password.encode('utf-8')
        # Verifica se a senha corresponde ao hash
        return bcrypt.checkpw(password, stored_password)

if __name__ == "__main__":
    # Usar Session importada do core_models
    # Garantir que todas as tabelas (incluindo auth_user) sejam criadas antes do uso
    Base.metadata.create_all(bind=db)

    with Session() as session:
        try:
            # Criando um usuário de teste que será enviado para o construtor da classe User em __init__
            novo_usuario = User(
                username="teste",
                email="teste@email.com",
                nome="Usuário Teste",
                password="senha123",
                tipo=UserType.online
            )
            session.add(novo_usuario)
            session.commit()
            logger.info('Usuário criado: %s', novo_usuario)
            
            # Demonstrando diferentes formas de impressão
            logger.info('\nDiferentes formas de impressão do objeto:')
            logger.info('1. Print direto (usa __str__): %s', novo_usuario)
            logger.info('2. Usando str() explícito: %s', str(novo_usuario))
            logger.info('3. Usando repr() explícito: %s', repr(novo_usuario))
            
            # Demonstrando o hash da senha e verificação
            logger.info('\nTestando a senha:')
            logger.info('Senha armazenada (hash): %s', novo_usuario.password)
            senha_teste = 'senha123'
            logger.info("Verificando senha '%s': %s", senha_teste, novo_usuario.check_password(senha_teste))
            senha_errada = 'senha456'
            logger.info("Verificando senha errada '%s': %s", senha_errada, novo_usuario.check_password(senha_errada))

            user = User(username='teste', email='teste@email.com', nome='Test User', password='minhasenha123')
            logger.info('Hash da senha: %s', user.password)
            logger.info('Senha correta?: %s', user.check_password('minhasenha123'))  # True
            logger.info('Senha errada?: %s', user.check_password('senha_errada'))    # False

        except Exception as e:
            session.rollback()
            logger.exception('Erro ao criar usuário: %s', e)