# Maxbono Sorvetes — PWA de vendas por rota

Registra **pacotes vendidos** (Picolé Simples, Picolé de Cobertura, Cremosinho) por **rota/região**, funciona **offline** e sincroniza com o **Supabase** entre os dois sócios.

Telas: **Painel** (gráficos e indicadores), **Histórico**, **Registrar**, **Financeiro** (entradas, gastos e saldo) e **Ajustes** (foto do perfil, sincronização, exportar).

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Atomic Design · PWA · Dexie (IndexedDB) · Supabase.

## Rodar

```bash
npm install
cp .env.local.example .env.local   # preencha URL e publishable key do Supabase
npm run dev                        # desenvolvimento (service worker desligado)
```

Para testar o modo offline de verdade, use o build de produção:

```bash
npm run build && npm start         # abre em http://localhost:3000
```

## Supabase

1. No painel: **SQL Editor → New query**, cole e rode **em ordem** cada arquivo de `supabase/migrations/`:

| Arquivo | O que faz |
|---|---|
| `0001_init.sql` | `sellers`, `routes`, `route_points`, `sales`, gatilhos e políticas RLS |
| `0002_seller_avatar.sql` | coluna `sellers.avatar_url` (foto do perfil); a chave do app só pode alterar a foto |
| `0003_finance.sql` | `product_prices`, `expenses` e o valor das vendas (`unit_prices`, `amount_cents`) |
| `0004_route_soft_delete.sql` | `routes.deleted_at`: excluir rota sem perder as vendas dela (dá para restaurar) |
| `0005_seller_role_edit.sql` | libera o app para editar o **cargo** do sócio (nome e PIN continuam só pelo SQL) |

   Todos podem ser rodados de novo sem estragar nada. Se faltar uma migração, o app avisa
   "Banco desatualizado" e continua sincronizando os pacotes.
2. **Troque os nomes e PINs** dos dois sócios (o SQL cria "Sócio 1" PIN 1111 e "Sócio 2" PIN 2222):

```sql
update public.sellers
   set name = 'João', pin_hash = encode(extensions.digest('4821', 'sha256'), 'hex')
 where name = 'Sócio 1';
```

3. Copie **Project URL** e **publishable key** (Settings → API Keys) para o `.env.local`.

## Financeiro

- Defina o **preço por pacote** de cada produto no fim da tela Financeiro. Ele vem preenchido em cada venda
  e pode ser ajustado só naquela venda (cliente com desconto, por exemplo).
- Cada venda guarda o preço usado. Vendas antigas, de antes do financeiro, usam o preço padrão atual.
- Gastos têm valor, descrição, categoria, data e quem pagou. Saldo = entradas das vendas − gastos.
- Dinheiro é sempre guardado em **centavos inteiros**.

## Como funciona o offline

- Tudo que a tela lê e grava passa pelo **IndexedDB** (`src/lib/db.ts`). Sem internet, nada muda para o usuário.
- Cada venda nasce com um **UUID** no aparelho e fica marcada `dirty`. A sincronização (`src/lib/sync.ts`) **envia** o que está `dirty` (rotas → pontos → vendas → fotos, preços e gastos) e depois **baixa** o que mudou no servidor. Como usa upsert por UUID, repetir o envio nunca duplica.
- Dispara sozinha: ao abrir, ao voltar a internet, ao voltar para o app e a cada 2 min. Também em **Ajustes → Forçar sincronização**.
- Apagar venda ou gasto é **exclusão lógica** (`deleted_at`), para o apagar também chegar ao aparelho do sócio.
- A foto do perfil é reduzida no aparelho para 256 px (~20 KB) e guardada no próprio cadastro do sócio.
- O **service worker** (`public/sw.js`) guarda as 6 telas e todos os arquivos delas na instalação e a cada abertura online. Só roda em produção.

## Estrutura (Atomic Design)

```
src/
  app/                  páginas finas (login, / painel, registrar, historico, financeiro, ajustes) + manifest
  components/
    atoms/              Button, IconButton, Badge, Card, Input, MoneyInput, Select, Toggle, Avatar, Logo...
    molecules/          QuantityStepper, ProductCard, StatTile, SegmentedControl, AvatarPicker, Modal, Toast...
      charts/           ColumnChart, RankedBars, ChartLegend, DataTable (HTML/CSS puro, sem biblioteca)
    organisms/          AppHeader, BottomNav, FilterBar, SaleForm, ExpenseModal, PriceTable, SyncPanel, PinLogin...
    templates/          AppShell (protege + header + nav), AuthLayout
  providers/            Session (perfil/PIN), Sync, Pwa, Toast
  lib/                  db (Dexie), sync, supabase, repo (escritas), stats, finance, money, filters, series, image
  hooks/                leituras reativas do banco local, useLogout
supabase/migrations/    SQL (rodar em ordem)
public/                 logo.png (arte oficial), brand/ (recorte usado no app), icons/, sw.js
scripts/                generate-icons.mjs: refaz marca e ícones a partir de public/logo.png
```

Tokens (cores, tipografia, raios `card`/`control`/`chip`, cores dos gráficos) estão em `src/app/globals.css` (`@theme`).

## Git flow

- `main`: versão em produção. `develop`: integração.
- Trabalho novo sai de `develop` em `feature/*`, `fix/*`, `style/*`, `refactor/*` ou `docs/*` e volta com merge `--no-ff`.
- Commits em inglês no padrão Conventional Commits (`feat:`, `fix:`, `style:`, `refactor:`, `docs:`).
- Para publicar: `release/x.y.z` a partir de `develop`, merge em `main` com tag e de volta em `develop`.

## Limites conhecidos

- **Segurança do banco:** o app usa a chave `anon` e as políticas RLS liberam leitura/escrita para ela. Quem tiver a URL + chave consegue ler e gravar vendas. O **PIN é só um bloqueio de tela** (hash SHA-256 conferido no aparelho). Próximo passo recomendado: Supabase Auth + políticas `to authenticated`.
- Não há **editar** venda nem gasto (apague e registre de novo). Rotas podem ser editadas, excluídas e restauradas em **Ajustes → Rotas**.
- Primeira abertura de cada aparelho precisa de internet (para baixar os perfis).
- Para instalar e usar offline, o site precisa estar em **HTTPS** (ou localhost).
