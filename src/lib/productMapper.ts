import { Produto } from '@/types/produto';
import { Categoria } from '@/types/categoria';
import { EmpresaData } from '@/types/empresa';

export const resolveCategoryName = (categoriaField: unknown, categorias?: Categoria[]): string => {
  if (categoriaField === undefined || categoriaField === null || categoriaField === '') return '';
  if (!categorias || categorias.length === 0) return String(categoriaField);

  // If categoriaField is an object (e.g. { id, nome }), try to match by id then by name (case-insensitive)
  if (typeof categoriaField === 'object') {
    const cf = categoriaField as Record<string, unknown>;
    const maybeId = Number(cf['id'] ?? cf['categoriaId'] ?? cf['categoria_id'] ?? NaN);
    if (!isNaN(maybeId)) {
      const foundById = categorias.find(c => c.id === maybeId);
      if (foundById) return foundById.nome;
    }

    const maybeName = String(cf['nome'] ?? cf['name'] ?? '').trim();
    if (maybeName) {
      // Prefer exact name match (case-sensitive) — backend is source of truth
      const foundByName = categorias.find(c => c.nome === maybeName);
      if (foundByName) return foundByName.nome;
      return maybeName;
    }

    return String(categoriaField);
  }

  // categoriaField is primitive (string or number)
  const asNumber = Number(categoriaField);
  const cfStr = String(categoriaField);
  // Prefer id match, then exact name match (case-sensitive), then fallback to string
  const found = categorias.find(c => c.id === asNumber || String(c.id) === cfStr || c.nome === cfStr);
  return found ? found.nome : cfStr;
};

export const mapBackendProdutoToLocal = (p: unknown, categorias?: Categoria[], empresas?: EmpresaData[]): Produto => {
  const obj = p as Record<string, unknown>;
  // Helper: tenta extrair um número de uma lista de chaves possíveis
  const getNumericField = (o: Record<string, unknown>, keys: string[], fallback = 0): number => {
    for (const k of keys) {
      const v = o[k];
      if (v === undefined || v === null) continue;
      // se for objeto com {value} ou {quantidade: ...}
      if (typeof v === 'object') {
        const maybe = (v as Record<string, unknown>)['value'] ?? (v as Record<string, unknown>)['quantidade'] ?? (v as Record<string, unknown>)['qtd'];
        if (maybe !== undefined && maybe !== null) {
          const n = Number(maybe);
          if (!isNaN(n)) return n;
        }
        continue;
      }

      const num = Number(v);
      if (!isNaN(num)) return num;
    }
    return fallback;
  };
  // keys a checar para estoque e valor detectado (usado para debug)
  const estoqueKeys = ['estoque', 'stock', 'quantidade', 'qtd', 'quantity', 'saldo', 'estoque_atual', 'quantidade_estoque'];
  const estoqueVal = getNumericField(obj, estoqueKeys);

  // Log para debug — mostrar id, nome, estoque detectado e valores brutos
  try {
    const rawValues = estoqueKeys.reduce((acc: Record<string, unknown>, k) => { acc[k] = obj[k]; return acc; }, {});
    console.debug('[productMapper] mapBackendProdutoToLocal', { id: Number(obj.id ?? 0), nome: String(obj.nome ?? ''), estoque: estoqueVal, raw: rawValues });
  } catch (e) {
    // se ambiente restringe console, não quebramos o fluxo
  }

  return {
    id: Number(obj.id ?? 0),
    nome: String(obj.nome ?? ''),
    // Support both camelCase and snake_case keys returned by different backends
    categoria: resolveCategoryName(obj['categoria'] ?? obj['categoriaId'] ?? obj['categoria_id'] ?? obj['categoria_id'] ?? '', categorias),
    descricao: String(obj.descricao ?? obj.description ?? ''),
    // custo pode vir como 'custo', 'preco_compra', 'precoCompra', 'cost'
    custo: Number(obj.custo ?? obj.preco_compra ?? obj.precoCompra ?? obj.cost ?? 0),
    // venda pode vir como 'venda', 'preco_venda', 'precoVenda', 'price'
    venda: Number(obj.venda ?? obj.preco_venda ?? obj.precoVenda ?? obj.price ?? 0),
    codigo: String(obj.codigo ?? obj.code ?? ''),
    // estoque pode vir com vários nomes: 'estoque', 'stock', 'quantidade', 'qtd', 'quantity', 'saldo', etc.
    estoque: estoqueVal,
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
