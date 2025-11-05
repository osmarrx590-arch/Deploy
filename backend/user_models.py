# Módulo compatível com import side-effect usado em startup de backend.main
# Alguns scripts antigos esperavam um arquivo `user_models.py`. Aqui reexportamos
# tipos/models relevantes a partir de `backend.models` para manter compatibilidade.

from .models import User, UserType  # noqa: F401

# Se no futuro for necessário construir modelos separados para auth/local, adicione aqui.
