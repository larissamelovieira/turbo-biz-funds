# Bug Report — Receita recorrente não conta no saldo do mês atual

**Data:** 06/07/2026
**Prioridade:** Alta — usuário registra receita, dashboard mostra R$ 0,00 em Receitas
**Relacionado a:** Correção #012 — Melhorar Fluxo de Cadastro de Renda Mensal

---

## Evidência

Usuária **Larissa** registrou receita (salário) via WhatsApp. Dashboard mostra:

```
Saldo do Mês: -R$ 822,90
Receitas: R$ 0,00
Despesas: R$ 822,90
```

Saldo negativo bate com despesas, mas receita cadastrada não aparece — soma zero.

---

## Causa provável

Receita cadastrada como **recorrente** é gravada na tabela `recurrences`, mas não gera
uma transação (`transactions`) para o mês corrente. O card "Receitas" do dashboard
(`GET /v1/summary/balance`) soma a partir de `transactions` — sem uma linha na tabela
de transações do mês atual, o valor não entra na soma.

A transação do mês só passaria a existir depois de rodar `POST /v1/recurrences/generate`
(cron ou trigger manual) — que aparentemente não roda no momento do cadastro.

---

## Comportamento esperado (Correção #012)

Ao cadastrar receita, perguntar ao usuário:

> "Essa receita de R$ 5.100 faz parte da sua renda fixa mensal?"
> - Sim, recebo esse valor todos os meses.
> - Não, foi uma receita pontual.

- **Sim (recorrente):** criar a recorrência **E** já criar/gerar a transação do mês
  atual imediatamente — não esperar o próximo ciclo do `generate`.
- **Não (pontual):** registrar só a transação do mês atual, sem criar recorrência.

---

## Fix esperado

No endpoint que processa o cadastro de receita recorrente (via WhatsApp bot ou
`POST /v1/recurrences`):

1. Criar o registro em `recurrences` normalmente.
2. Ao mesmo tempo, criar a transação (`transactions`) referente ao mês atual —
   não depender apenas do job `generate` para o primeiro mês.
3. Garantir que `GET /v1/summary/balance` reflita essa transação imediatamente.

```
POST /v1/recurrences
{
  "categoryId": "...",
  "type": "INCOME",
  "amount": 5100,
  "description": "Salário",
  "isRecurring": true
}

→ Deve resultar em:
  1. Registro em recurrences (para os próximos meses)
  2. Transação criada em transactions para o mês atual (occurredAt = hoje)
```

---

## Impacto

- Relatórios e saldo do mês ficam incorretos sempre que a primeira receita
  cadastrada é marcada como recorrente.
- Usuário vê saldo negativo mesmo tendo renda registrada, gerando desconfiança
  no app.

---

## Resumo rápido

1. Implementar pergunta sim/não pós-cadastro de receita (fluxo #012).
2. Ao marcar como recorrente, gerar transação do mês atual junto com a recorrência.
3. Confirmar que `/v1/summary/balance` soma essa transação imediatamente após cadastro.
