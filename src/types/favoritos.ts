
import { Produto } from './produto';

export interface FavoritosContextType {
  favoritos: Produto[];
  toggleFavorito: (produto: Produto) => void;
  isFavorito: (produtoId: number) => boolean;
  removerFavorito: (produtoId: number) => void;
  adicionarFavorito: (produto: Produto) => void;
}
