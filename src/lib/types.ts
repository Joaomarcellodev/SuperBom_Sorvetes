export type ProductId = "simples" | "cobertura" | "cremosinho";

/** Pacotes por produto. Produto ausente = 0. */
export type SaleItems = Partial<Record<ProductId, number>>;

export interface Seller {
  id: string;
  name: string;
  role: string;
  /** SHA-256 (hex) do PIN. O PIN é um bloqueio de tela, não é a segurança do banco. */
  pinHash: string;
  /** Foto de perfil em data URL (JPEG pequeno). null = usa as iniciais. */
  avatarUrl?: string | null;
  /** 1 = foto trocada no aparelho e ainda não enviada ao Supabase */
  avatarDirty?: 0 | 1;
}

export interface Route {
  id: string;
  name: string;
  cities: string[];
  createdAt: string;
  /** 1 = criada/alterada no aparelho e ainda não enviada ao Supabase */
  dirty: 0 | 1;
}

export interface RoutePoint {
  id: string;
  routeId: string;
  name: string;
  dirty: 0 | 1;
}

export interface Sale {
  id: string;
  routeId: string;
  pointName: string;
  sellerId: string;
  /** YYYY-MM-DD no fuso do aparelho */
  saleDate: string;
  note: string;
  items: SaleItems;
  /** soma dos pacotes (redundante de propósito, facilita consultas) */
  total: number;
  createdAt: string;
  deletedAt: string | null;
  dirty: 0 | 1;
}

export interface MetaRow {
  key: string;
  value: unknown;
}
