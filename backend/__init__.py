"""Pacote backend.

Este arquivo torna o diretório `backend` um pacote Python e permite imports
absolutos como `import backend.core_models` mesmo quando os scripts forem
executados a partir da raiz do projeto.
"""

__all__ = ["core_models", "user_models", "fisica_models", "online_models"]
