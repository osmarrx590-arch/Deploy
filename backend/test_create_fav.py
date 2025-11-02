from backend.online_views import create_favorito, list_favoritos, delete_favorito
from backend.core_models import Base, db

# Garantir que as tabelas existam
Base.metadata.create_all(bind=db)

print('Criando favorito (user=1,produto=1)')
fav = create_favorito(1,1)
print('created fav id=', getattr(fav,'id',None))
print('list for user 1 count=', len(list_favoritos(1)))
print('delete result=', delete_favorito(1,1))
print('list after delete count=', len(list_favoritos(1)))
