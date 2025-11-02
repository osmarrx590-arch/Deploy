import { Produto } from '@/types/produto';
import { Categoria } from '@/types/categoria';
import { EmpresaData } from '@/types/empresa';

export const resolveCategoryName = (categoriaField: string | number | undefined, categorias?: Categoria[]): string => {
  if (!categoriaField) return '';
  if (!categorias || categorias.length === 0) return String(categoriaField);
  const id = Number(categoriaField);
  const found = categorias.find(c => c.id === id || String(c.id) === String(categoriaField) || c.nome === categoriaField);
  return found ? found.nome : String(categoriaField);
};

export const mapBackendProdutoToLocal = (p: unknown, categorias?: Categoria[], empresas?: EmpresaData[]): Produto => {
  const obj = p as Record<string, unknown>;
  return {
    id: Number(obj.id ?? 0),
    nome: String(obj.nome ?? ''),
  // Support both camelCase and snake_case keys returned by different backends
  categoria: resolveCategoryName((obj.categoria ?? obj.categoriaId ?? obj.categoria_id ?? '') as string | number, categorias),
    descricao: String(obj.descricao ?? ''),
    custo: Number(obj.custo ?? 0),
    venda: Number(obj.venda ?? 0),
    codigo: String(obj.codigo ?? ''),
    estoque: Number(obj.estoque ?? 0),
    disponivel: Boolean(obj.disponivel ?? true),
    empresaId: Number((obj.empresaId ?? obj.empresa_id ?? (obj.empresa as Record<string, unknown>)?.id) ?? 0),
    imagem: String(obj.imagem ?? ''),
    slug: String(obj.slug ?? ''),
  } as Produto;
};

export default {
  resolveCategoryName,
  mapBackendProdutoToLocal,
};
