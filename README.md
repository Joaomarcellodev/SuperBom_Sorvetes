# Maxbono Sorvetes — PWA de vendas por rota

Registra **pacotes vendidos** (Picolé Simples, Picolé de Cobertura, Cremosinho) por **rota/região**, funciona **offline** e sincroniza com o **Supabase** entre os dois sócios.

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

1. No painel: **SQL Editor → New query**, cole `supabase/migrations/0001_init.sql` e rode.
   Cria `sellers`, `routes`, `route_points`, `sales`, gatilhos e políticas RLS.
   Se você já tem tabelas com esses nomes, revise antes.
2. **Troque os nomes e PINs** dos dois sócios (o SQL cria "Sócio 1" PIN 1111 e "Sócio 2" PIN 2222):

```sql
update public.sellers
   set name = 'João', pin_hash = encode(extensions.digest('4821', 'sha256'), 'hex')
 where name = 'Sócio 1';
```

3. Copie **Project URL** e **publishable key** (Settings → API Keys) para o `.env.local`.

## Como funciona o offline

- Tudo que a tela lê e grava passa pelo **IndexedDB** (`src/lib/db.ts`). Sem internet, nada muda para o usuário.
- Cada venda nasce com um **UUID** no aparelho e fica marcada `dirty`. A sincronização (`src/lib/sync.ts`) **envia** o que está `dirty` (rotas → pontos → vendas) e depois **baixa** o que mudou no servidor. Como usa upsert por UUID, repetir o envio nunca duplica.
- Dispara sozinha: ao abrir, ao voltar a internet, ao voltar para o app e a cada 2 min. Também em **Ajustes → Forçar sincronização**.
- Apagar venda é **exclusão lógica** (`deleted_at`), para o apagar também chegar ao aparelho do sócio.
- O **service worker** (`public/sw.js`) guarda as 5 telas e todos os arquivos delas na instalação e a cada abertura online. Só roda em produção.

## Estrutura (Atomic Design)

```
src/
  app/                  páginas finas (login, /, registrar, historico, ajustes) + manifest
  components/
    atoms/              Button, IconButton, Badge, Card, Input, Select, Toggle, Avatar, Skeleton...
    molecules/          QuantityStepper, ProductCard, StatCard, SellerToggle, PinPad, SaleListItem, Modal, Toast...
    organisms/          AppHeader, BottomNav, SaleForm, RouteSelector, SalesHistoryList, SyncPanel, PinLogin...
    templates/          AppShell (protege + header + nav), AuthLayout
  providers/            Session (perfil/PIN), Sync, Pwa, Toast
  lib/                  db (Dexie), sync, supabase, repo (escritas), stats, export, format
  hooks/                leituras reativas do banco local
supabase/migrations/    SQL
public/                 sw.js, ícones
```

Tokens do Stitch (cores, tipografia, raios) estão em `src/app/globals.css` (`@theme`).

## Limites conhecidos da v1

- **Segurança do banco:** o app usa a chave `anon` e as políticas RLS liberam leitura/escrita para ela. Quem tiver a URL + chave consegue ler e gravar vendas. O **PIN é só um bloqueio de tela** (hash SHA-256 conferido no aparelho). Próximo passo recomendado: Supabase Auth + políticas `to authenticated`.
- Não há **editar** venda (apague e registre de novo).
- Primeira abertura de cada aparelho precisa de internet (para baixar os perfis).
- Para instalar e usar offline, o site precisa estar em **HTTPS** (ou localhost).
