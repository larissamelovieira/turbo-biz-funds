# Spec — Correções do documento "correção 06.07" (backend + IA/WhatsApp)

**Data:** 06/07/2026
**Fonte:** Documento de correções enviado pelo cliente (25 itens, #011-#025)
**Nota:** Itens puramente de frontend (#022, #023, #024 parcial, #025 nome do cartão —
exibição) já foram corrigidos direto no código. Este spec cobre só o que depende de
backend, IA/bot do WhatsApp, ou envio de e-mail.

---

## #011 — E-mail de recuperação de senha não é enviado

Ao clicar "Esqueci minha senha", cliente não recebe e-mail. Validar disparo do
provedor de e-mail (SMTP/SES/Resend/etc) no fluxo de reset de senha.

**Junto com isso**, configurar os demais e-mails transacionais da plataforma:
- Recuperação de senha
- Compra aprovada
- Compra não aprovada
- Boas-vindas
- Demais comunicações automáticas previstas

**Prioridade:** Alta.

---

## #012 — Pergunta genérica sobre renda mensal + fluxo recorrente

Pergunta atual do bot ("Você pretende continuar recebendo esse valor pelos próximos
meses?") é vaga — usuária respondeu "Não cada mês é um valor diferente" e a receita
ficou de fora do dashboard (Receitas: R$ 0,00 com Despesas: R$ 822,90 registradas).

**Trocar pergunta para:**
> "Essa receita de R$ 5.100 faz parte da sua renda fixa mensal?"
> - ✅ Sim, recebo esse valor todos os meses.
> - ❌ Não, foi uma receita pontual.

**Comportamento:**
- Sim → cadastra como recorrente, entra no planejamento dos próximos meses
- Não → registra só no mês atual, sem criar recorrência

**Crítico:** hoje, aparentemente, quando a resposta não é um "sim" direto e óbvio pro
parser da IA, a receita não é registrada em lugar nenhum (nem mês atual, nem
recorrência) — ver exemplo do PDF onde a receita de R$ 5.100 simplesmente sumiu.
Precisa garantir que a receita SEMPRE seja registrada no mês atual independente da
resposta sobre recorrência — a pergunta só decide se também vira recorrência.

Já detalhado em `BACKEND_BUG_RENDA_RECORRENTE.md`.

**Prioridade:** Alta.

---

## #013 — Incluir link do Dashboard nas respostas do bot

Sempre que o bot mencionar consultas, relatórios, gráficos, categorias, metas, edição
ou exclusão de registros, incluir link direto pro Dashboard na resposta.

Exemplo:
```
Seu gasto foi registrado com sucesso.

Para visualizar, editar ou excluir este lançamento, acesse seu Dashboard:
[LINK DO DASHBOARD]
```

**Prioridade:** Média (UX) — mas simples de implementar (template de resposta).

---

## #014 / #021 — Despesas/receitas recorrentes devem refletir em todas as abas

Recorrência cadastrada (ex: aluguel R$ 1.800) hoje só aparece na aba "Recorrências" —
não vira transação real, não soma no total de despesas do Dashboard, não aparece em
Transações nem Relatórios.

**Fix esperado:** ao criar uma recorrência (receita ou despesa), gerar IMEDIATAMENTE a
transação real do mês atual (não esperar cron/generate). Isso já garante consistência
em: Transações, Despesas do mês, Gráficos, Relatórios — pois todos esses lugares no
frontend leem da mesma fonte (`/v1/transactions`).

Mesma causa raiz do bug de renda recorrente (#012). Ver `BACKEND_BUG_RENDA_RECORRENTE.md`.

**Prioridade:** Alta.

---

## #015 — Simplificar alerta de despesas maiores que a receita

Bot hoje expõe a conta matemática crua:
```
Receitas – Despesas fixas – Investimentos:
1000 - (1800 + 200 + 350 + 2300 + 600) = R$ (-4250)
```

**Trocar por mensagem amigável, sem exibir fórmula:**
```
⚠️ Atenção!
Seus gastos estão maiores do que o dinheiro que entrou este mês.
Você está gastando cerca de R$ 4.250 a mais do que recebeu.
Vale dar uma olhada nos seus gastos e ver onde dá para economizar.
Acesse seu Dashboard para ver os detalhes ou me peça um resumo com todos os
seus gastos detalhados por categoria.
[LINK DO DASHBOARD]
```

**Prioridade:** Alta (é prompt/template da IA, ajuste rápido).

---

## #017 — Lentidão e revisão do cálculo de metas financeiras

Pergunta "Falta quanto para atingir minha meta financeira?" demorou (14:19 → 14:25,
~6min) para responder. Investigar:
- Timeout/lentidão na consulta ao banco pela IA
- Se o cálculo (`target - current`) está sempre correto e atualizado

**Prioridade:** Alta.

---

## #018 / #019 / #020 — Recorrências não projetam meses futuros no relatório

Consultar um mês futuro (ex: dezembro) mostra tudo zerado mesmo com despesas/receitas
recorrentes cadastradas. Objetivo: usuário ver saldo previsto considerando
recorrências ativas, não só transações manuais já lançadas.

**Mitigação já aplicada no frontend:** `Relatorio.tsx` agora projeta valores de
recorrências ativas (mensal/anual) para qualquer mês sem transação real no banco —
os cards de Receita/Despesa e o gráfico de evolução mensal já mostram a projeção com
aviso "valores abaixo são uma projeção baseada nas suas recorrências ativas".

**Isso é só front.** Fix definitivo (recomendado) é backend gerar a transação real do
mês assim que ele começa (via cron mensal rodando `/v1/recurrences/generate`), e
idealmente a API já devolver um campo de "saldo projetado" pros meses futuros com
lógica de negócio validada (juros, proporcional a dias, etc — hoje o frontend faz um
cálculo simples de "recorrência mensal = valor cheio todo mês").

Depende também de `BACKEND_SPEC_PERIODO_TRANSACOES.md` (o endpoint de transações só
aceita `period=30d/15d/7d`, não filtra por ano/mês arbitrário — sem isso o Relatório
nunca vai poder mostrar meses fora dessa janela mesmo que a transação exista).

**Prioridade:** Alta.

---

## #025 — Cartão sem nome + compra no cartão via WhatsApp não soma despesas

**Nome do cartão:** ao criar cartão pela IA (WhatsApp), campo `name` não está sendo
salvo/enviado — cartão aparece sem identificação no Dashboard. Corrigir o fluxo da IA
para sempre perguntar/capturar o nome do cartão (ex: "Nubank", "Cartão Inter") e
enviar no payload de criação (`POST /v1/cards`).

**Compra no cartão não soma despesas:** quando usuário registra "Gastei R$ 100 no
supermercado no cartão de crédito" via WhatsApp, o valor é lançado em `cards`
(atualiza limite usado) mas **não cria uma transação em `transactions`** — por isso
não aparece em Despesas do mês, Relatórios, Gráficos nem seria contado pela IA em
consultas futuras.

**Fix esperado:** toda compra no cartão registrada pela IA deve, na mesma operação:
1. Atualizar `used` do cartão (como já faz)
2. Criar uma transação EXPENSE real vinculada à categoria informada

Isso já foi corrigido no fluxo web (`src/pages/Cards.tsx` — dialog "Atualizar uso"),
mas o fluxo via WhatsApp bot é server-side e precisa do mesmo tratamento no backend.

**Prioridade:** Alta.

---

## Resumo de prioridades

| # | Item | Prioridade | Tipo |
|---|------|-----------|------|
| 011 | E-mail recuperação senha + demais e-mails | Alta | Backend/infra |
| 012 | Pergunta renda + receita sumindo | Alta | IA/bot |
| 013 | Link dashboard nas respostas | Média | IA/bot |
| 014/021 | Recorrência não gera transação real | Alta | Backend |
| 015 | Alerta despesa > receita expõe fórmula | Alta | IA/bot |
| 017 | Lentidão + cálculo de meta | Alta | Backend/IA |
| 018/019/020 | Projeção futura de recorrências | Alta | Backend (+ período, ver spec separado) |
| 025 | Cartão sem nome + compra não soma despesa | Alta | IA/bot + Backend |
