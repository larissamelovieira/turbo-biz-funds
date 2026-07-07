# Spec — Filtro de período real para /v1/transactions

**Data:** 06/07/2026
**Prioridade:** Crítica — bloqueia Relatório anual/mensal e projeção de parcelas futuras
**Relacionado a:** Correção parcelamento, BACKEND_SPEC_PARCELAMENTO.md, BACKEND_BUG_RENDA_RECORRENTE.md

---

## Problema

`GET /v1/transactions` só aceita `period` como janela relativa fixa: `weekly` (7d),
`15d`, `30d` — sempre contando pra trás a partir de hoje. Não existe forma de pedir
"transações do ano X" ou "transações de um mês específico, passado ou futuro".

## Onde isso quebra hoje

`src/pages/Relatorio.tsx` deixa o usuário escolher **qualquer ano/mês** (seletor Ano +
Mês), mas busca sempre com `?period=30d` e filtra client-side. Resultado:

- Selecionar Janeiro/2026 com a data atual em Julho → mostra vazio (fora da janela de 30d)
- Parcelas futuras de compra parcelada (Agosto, Setembro...) → nunca aparecem, mesmo
  que a transação exista no banco com `occurredAt` correto, porque `period=30d` conta
  só pra trás
- Recorrências antigas de meses passados (fora dos últimos 30 dias) → somem do relatório

Isso também afeta potencialmente `Transactions.tsx` e `Categories.tsx`, que hoje só
oferecem `weekly/15d/30d` como opções — sem forma de ver "mês passado" ou "próximo mês".

## Fix esperado

Endpoint `GET /v1/transactions` aceitar parâmetros adicionais (mantendo `period` para
compatibilidade com quem já usa):

```
GET /v1/transactions?year=2026&month=7
GET /v1/transactions?startDate=2026-01-01&endDate=2026-12-31
```

Prioridade de implementação:
1. `year` (obrigatório) + `month` (opcional, 1-12) — cobre o caso do Relatório
   (seletor Ano + Mês, "Todos os meses" = só `year`)
2. `startDate`/`endDate` (formato ISO) — mais flexível, cobre qualquer range custom

Resposta mantém o mesmo formato atual (`{ data: Transaction[] }`), só muda o filtro
aplicado na query.

## Fix esperado (frontend, após backend pronto)

Em `src/pages/Relatorio.tsx`, trocar:

```ts
queryFn: () => api.get(`${apiEndpoints.transactions.list}?period=30d`)
```

por:

```ts
queryFn: () => api.get(`${apiEndpoints.transactions.list}?year=${selectedYear}`)
```

E remover o filtro client-side por ano que hoje mascara o problema (linha
`yearTransactions` em `Relatorio.tsx`), já que o backend passa a devolver só o ano certo.

---

## Impacto se não corrigir

- Relatório mensal/anual continua não confiável — mostra só o que cair nos últimos 30
  dias, independente do que o usuário selecionar na tela
- Recursos de parcelamento (compra parcelada, renda recorrente) ficam com projeção
  futura "invisível" mesmo com dado correto gravado no banco
- Usuário perde confiança no relatório por parecer que "sumiu dinheiro"
