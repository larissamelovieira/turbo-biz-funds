# TODO backend: vínculo Cartão ↔ Transação

## Estado atual

Cartão e transação são **duas entidades separadas**, sem link real
(`Transaction`/`CreateTransactionDto` não tem `cardId` na API — confirmado no
swagger de produção em `https://api.doutorcashapp.com.br/docs`, schema
`CreateTransactionDto` só tem `categoryId`, `type`, `amount`, `description`,
`occurredAt`).

Compra no cartão = 2 escritas independentes, feitas em sequência pelo
frontend (`src/pages/Cards.tsx`, `handleUsage`):

1. `POST /v1/transactions` — cria a despesa (`EXPENSE`), com o nome do
   cartão só como sufixo de texto na `description`
   (`"${desc} (${card.name})"`). **Feita primeiro e aguardada** — se falhar,
   nada mais acontece (cartão não é tocado).
2. `PATCH /v1/cards/:id` — atualiza `used` do cartão
   (`src/features/cards/hooks/use-cards.ts:72-81`).
3. `POST /v1/cards/:id/history` — grava o histórico do cartão
   (`src/features/cards/hooks/use-card-history.ts`). Tem fallback pra
   `localStorage` caso o endpoint responda 404/501 — hoje em produção o
   endpoint responde 201 normalmente, então esse fallback só existe por
   segurança.

Resultado: dashboard, lista de transações e relatório enxergam a despesa
normalmente (todos leem de `/v1/transactions`, sem filtro por origem), mas
**não há como saber, a partir da transação, de qual cartão ela veio** — só
dá pra inferir lendo o texto da `description`.

## O que já foi preparado no frontend

- `ApiTransaction.cardId?: string | null` já existe em `src/shared/types.ts`
  — opcional, pra não quebrar nada enquanto a API não devolve o campo.
- O `POST /v1/transactions` disparado em `Cards.tsx` já manda
  `cardId: String(usageCard.id)` no payload. A API atual ignora campos
  desconhecidos, então isso não quebra nada — no dia que o backend passar a
  aceitar/persistir `cardId`, o frontend já está mandando o dado certo sem
  precisar de novo deploy.

## O que falta no backend

1. Adicionar `cardId?: string` (opcional, FK pra `cards`) em
   `CreateTransactionDto` e persistir.
2. Devolver `cardId` no response de `GET /v1/transactions` e no envelope de
   criação.
3. (Opcional, mas recomendado) permitir filtrar
   `GET /v1/transactions?cardId=...` pra listar só as despesas de um cartão
   específico direto da fonte de verdade, sem depender de parsing de texto
   na `description`.
4. Corrigir o fluxo do bot/WhatsApp (`BACKEND_SPEC_CORRECOES_06_07.md`,
   item #025): hoje ele só atualiza `cards.used`, nunca cria a linha em
   `transactions` — logo compras feitas por lá nunca aparecem em
   despesas/dashboard/relatório.

## O que o frontend ainda pode fazer depois que o backend implementar

- Trocar o sufixo de texto na `description` (`"(Nome do Cartão)"`) por um
  badge/ícone de cartão na UI, lendo `transaction.cardId` e resolvendo pro
  nome do cartão via `/v1/cards`.
- Na tela de histórico do cartão (`Cards.tsx`, sheet de histórico), poder
  linkar cada entrada de `card_history` até a transação correspondente via
  `cardId`, hoje isso não é possível (são duas listas sem chave em comum).
- Simplificar `handleUsage` — hoje ele monta a `description` concatenando o
  nome do cartão manualmente; isso vira redundante quando `cardId` for a
  fonte de verdade.
