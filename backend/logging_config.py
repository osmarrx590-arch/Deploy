"""Configuração de logging para o backend.

Fornece um logger compartilhado configurado com formato simples e níveis.
"""
import logging
import sys

def configure_logging(level: int = logging.INFO):
    fmt = "%(asctime)s %(levelname)s %(name)s: %(message)s"
    logging.basicConfig(stream=sys.stdout, level=level, format=fmt)


# configurar ao importar
configure_logging()

# logger público para uso nos módulos
logger = logging.getLogger('happy-hops')
