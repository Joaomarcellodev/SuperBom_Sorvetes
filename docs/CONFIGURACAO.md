# Configuração e operação

Guia para quem vai **rodar a sua própria instância** do app ou cuidar do banco. Para conhecer o projeto, veja o [README](../README.md).

## 1. Supabase

Crie um projeto no [Supabase](https://supabase.com) e, em **SQL Editor → New query**, rode **em ordem** cada arquivo de [`supabase/migrations/`](../supabase/migrations):

| Arquivo | O que faz |
|---|---|
| `0001_init.sql` | `sellers`, `routes`, `route_points`, `sales`, gatilhos e políticas RLS. Cria dois sócios provisórios |
| `0002_seller_avatar.sql` | `sellers.avatar_url` (foto do perfil). A chave do app só pode alterar a foto |
| `0003_finance.sql` | `product_prices`, `expenses` e o valor das vendas (`unit_prices`, `amount_cents`) |
| `0004_route_soft_delete.sql` | `routes.deleted_at`: excluir rota sem perder as vendas dela |
| `0005_seller_role_edit.sql` | libera o app para editar o **cargo** do sócio |
| `0006_change_pin.sql` | função `change_seller_pin`: troca o PIN pelo app só se o PIN atual estiver certo |
| `0007_sale_payment.sql` | forma de pagamento e pendências das vendas (`payment_status`, `payment_method`, `paid_at`) |

Todos podem ser rodados de novo sem estragar nada. Se faltar uma migração, o app avisa **"Banco desatualizado"** e continua sincronizando os pacotes; o que depende da migração fica pendente no aparelho até ela ser aplicada.

### Nomes e PINs dos sócios

A `0001` cria "Sócio 1" e "Sócio 2" com PINs provisórios. Troque antes de usar:

```sql
update public.sellers
   set name = 'Seu nome',
       role = 'Sócio administrador',
       pin_hash = encode(extensions.digest('NOVO_PIN', 'sha256'), 'hex')
 where name = 'Sócio 1';
```

Depois disso, cada sócio troca o próprio PIN em **Ajustes → Mudar PIN**. O mesmo `update` serve para **redefinir um PIN esquecido** (o app baixa o PIN novo na próxima sincronização).

## 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com **Project URL** e **publishable key** (Settings → API Keys). O nome antigo `NEXT_PUBLIC_SUPABASE_ANON_KEY` também funciona.

> As variáveis `NEXT_PUBLIC_*` entram no código no momento do build: no deploy, cadastre-as **antes** do primeiro build.

## 3. Rodar

```bash
npm install
npm run dev          # desenvolvimento (service worker desligado)
npm test             # testes
npm run build && npm start   # produção: testar offline e instalação
```

Para instalar no celular e usar offline, o app precisa estar em **HTTPS** (ou `localhost`). A [Vercel](https://vercel.com) funciona sem configuração extra.

## 4. Como a sincronização funciona

- Tudo que a tela lê e grava passa pelo **IndexedDB** (`src/lib/db.ts`). Sem internet, nada muda para quem usa.
- Cada registro nasce com um **UUID** no aparelho e fica marcado como pendente. A sincronização (`src/lib/sync.ts`) **envia** os pendentes (rotas → pontos → vendas → fotos, cargos, preços e gastos) e depois **baixa** o que mudou no servidor, por cursor de `updated_at`. Upsert por UUID: repetir o envio nunca duplica.
- Dispara ao abrir, ao voltar a internet, ao voltar para o app, a cada 2 min e em **Ajustes → Forçar sincronização**.
- Apagar venda, gasto ou rota é **exclusão lógica** (`deleted_at`), para a exclusão chegar ao aparelho do sócio.
- `updated_at` sempre vem do servidor (gatilho), então relógio errado de celular não quebra a sincronização.
- O **service worker** (`public/sw.js`) guarda as telas e todos os arquivos delas na instalação e a cada abertura online.

## 5. Financeiro

- O **preço por pacote** de cada produto fica no fim da tela Financeiro. Ele vem preenchido em cada venda e pode ser ajustado só naquela venda.
- Cada venda guarda o preço usado. Vendas de antes do financeiro usam o preço padrão atual.
- Dinheiro é sempre guardado em **centavos inteiros**.
- Cada venda guarda a **forma de pagamento**. "Pagar depois" vira pendência da rota (`payment_status = 'pendente'`) até alguém tocar em **Receber**; vendas antigas contam como pagas.
- O **PIX** usa a chave fixa em `src/lib/pix.ts` (constante `PIX`). O QR Code e o copia e cola são PIX estáticos gerados no aparelho (padrão BR Code do Banco Central), com o valor da venda preenchido. Não há confirmação automática: quem vende confere no app do banco e toca em **Recebi**.

## 6. Marca e ícones

`public/logo.png` é a arte oficial. Se ela mudar:

```bash
node scripts/generate-icons.mjs
```

O script recorta a marca, remove o fundo e gera `public/brand/*.webp` e os ícones do PWA em `public/icons/`.

## 7. Fluxo de trabalho (git)

- `main`: versão publicada · `develop`: integração.
- Trabalho novo sai de `develop` em `feature/*`, `fix/*`, `style/*`, `refactor/*`, `test/*`, `docs/*` ou `chore/*` e volta com merge `--no-ff`.
- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `style:`…).
- Para publicar: pull request de `develop` para `main`.

## Segurança: o que saber

- O app usa a chave **publishable** e as políticas RLS liberam leitura e gravação para ela. Quem tiver a URL e a chave (ela aparece no código do site publicado) consegue ler e gravar vendas pela API.
- O **PIN** é um bloqueio de tela conferido no aparelho. Trocar o PIN pelo app passa por uma função no servidor que exige o PIN atual; a chave do app não tem permissão para gravar `pin_hash`.
- Próximo passo recomendado para uso com mais pessoas: **Supabase Auth** e políticas `to authenticated`.
