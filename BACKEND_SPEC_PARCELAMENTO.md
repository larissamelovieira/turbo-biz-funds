# Spec — Compras Parceladas (Parcelamento)

**Data:** 06/07/2026
**Prioridade:** Alta — relatório não mostra lançamentos futuros de despesas parceladas
**Status frontend:** workaround temporário implementado (loop client-side criando N transações)

---

## Problema

O app não tinha conceito de "parcelamento" — uma compra em N vezes era registrada como
uma única transação, então o Relatório e o Dashboard não mostravam os lançamentos dos
meses futuros (parcela 2/10, 3/10, etc).

## Workaround atual (frontend)

Em `src/pages/Transactions.tsx`, ao marcar "Compra parcelada", o frontend divide o valor
total por N e chama `POST /v1/transactions` em loop, uma vez por parcela, com
`occurredAt` incrementado em 1 mês por parcela e descrição `"{desc} (i/N)"`.

Isso funciona mas tem limitações:
- N requisições HTTP sequenciais (lento para parcelamentos grandes)
- Sem vínculo entre as parcelas no banco (não dá pra editar/cancelar o grupo todo de uma vez)
- Se uma parcela falhar no meio do loop, fica parcialmente criado

## Fix esperado (endpoint dedicado)

Criar endpoint específico:

```
POST /v1/transactions/installment
{
  "categoryId": "...",
  "type": "EXPENSE",
  "totalAmount": 1000,
  "installments": 10,
  "description": "Notebook",
  "occurredAt": "2026-07-06"
}
```

Backend deve:
1. Gerar 10 transações, uma por mês a partir de `occurredAt`, valor = totalAmount/10
   (ajustar arredondamento na última parcela)
2. Vincular todas por um `installmentGroupId` (novo campo na tabela `transactions`)
3. Descrição de cada parcela: `"{description} (i/10)"`

```json
HTTP 201
{
  "installmentGroupId": "uuid",
  "transactions": [ { "id": "...", "occurredAt": "2026-07-06", "amount": 100 }, ... ]
}
```

### Extra (desejável)

- `DELETE /v1/transactions/installment/:groupId` — cancela parcelas futuras não pagas
  do grupo (mantém as já passadas)
- `GET /v1/transactions?installmentGroupId=X` — lista todas as parcelas de um grupo

---

## Impacto se não corrigir

Frontend continua com workaround de loop (funcional, mas frágil) até endpoint dedicado
existir.
