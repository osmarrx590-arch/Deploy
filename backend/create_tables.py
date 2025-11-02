# Script para criar todas as tabelas do banco importando todos os módulos de modelos
# Executar a partir da raiz do projeto: python .\backend\create_tables.py

from backend.core_models import Base, db
from backend.logging_config import logger

# Importar todos os módulos de modelos para que suas classes registrem metadata no Base
# Usuário (auth_user)
import backend.user_models  # noqa: F401
# Mesas, movimentações e outros modelos físicos
import backend.fisica_models  # noqa: F401
# Core models (produtos, categorias, empresas)
import backend.core_models  # noqa: F401

logger.info('Criando todas as tabelas (idempotente)...')
Base.metadata.create_all(bind=db)
logger.info('Tabelas criadas (ou já existentes).')
