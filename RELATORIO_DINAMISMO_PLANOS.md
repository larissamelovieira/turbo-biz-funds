# Relatório — Dinamismo de Planos e Preços (Landing + Checkout)

**Data:** 24/07/2026
**Complementa:** `RELATORIO_CORRECOES_ADMIN.md`, Correção #006 (Aba "Planos")

---

## Pergunta do cliente

> Se eu criar um novo plano (ou mudar o preço) no painel Admin, isso aparece automaticamente na Landing Page e no fluxo de Cadastro/Pagamento? Consigo, por exemplo, criar um "Plano de Natal" com PIX R$ 20,00 e Cartão R$ 120,00, direto pelo painel, sem chamar o time técnico?

**Resposta curta: hoje, não.** Abaixo está o motivo, o que já funciona, e o que falta pra isso ser possível.

---

## O que já funciona (testado hoje, em produção)

Testamos criar, editar e apagar um plano de teste direto pela API do painel Admin (mesma API que o botão "Criar Novo Plano" usa):

- Criamos um plano de R$ 1,00.
- Geramos uma cobrança real (QR Code PIX) para esse plano usando o gateway de pagamento (EfiBank).
- O QR Code foi gerado corretamente **no valor de R$ 1,00**.

**Conclusão:** o motor de cobrança (API + EfiBank) já é dinâmico. Ele cobra certinho qualquer valor que estiver cadastrado no plano. O problema não é o pagamento em si.

---

## O que NÃO funciona (root cause)

Fizemos o mesmo teste (criar plano "teste de plano", R$ 1,00/ano) e verificamos as duas telas que o cliente usa:

| Tela | Resultado |
|---|---|
| Painel Admin → Planos | ✅ Aparece corretamente (2 cards: Pro e o novo) |
| Landing Page (site público) | ❌ Continua mostrando só o texto fixo "R$ 99,90 / 12x de R$ 12,90" |
| Fluxo de Cadastro → Escolha de Plano | ❌ Mesmo texto fixo, plano novo não aparece |

**Motivo:** a Landing Page (`Pricing.tsx`) e a tela de Pagamento (`Pagamento.tsx`) foram construídas com os valores **escritos direto no código** (R$ 99,90 / R$ 154,80), sem nunca consultar o painel Admin. Isso é independente de plano — mesmo que você cadastre 5 planos novos, nenhuma dessas duas telas vai ler o que está no banco de dados, porque elas simplesmente não fazem essa busca.

Isso é consertável (é trabalho de frontend, sem depender de outro time) — ver seção "Opções" abaixo.

---

## Limitação adicional: preço único por plano

Além do problema acima, existe uma segunda limitação, essa sim dependente do backend:

O cadastro de plano no Admin hoje salva **um único valor de preço** por plano (campo `price`). Não existe campo separado para "preço no PIX" e "preço no Cartão".

Isso significa que o exemplo do "Plano de Natal" (PIX R$ 20 / Cartão R$ 120 — dois valores diferentes pro mesmo plano) **não tem onde ser salvo** no formato atual do banco de dados. Essa limitação já tinha sido registrada no relatório anterior (Correção #006): a configuração de PIX/parcelas/cartão que existe hoje fica salva só no navegador do administrador (localStorage), não no banco — ou seja, some se limpar o cache, e não é o que aparece pro cliente final.

---

## Opções

### Opção A — Preço único (mais rápido, só frontend)
Um único valor por plano vale pra PIX e Cartão. Ex: plano de R$ 99,90, cobra R$ 99,90 nos dois métodos.
- ✅ Não depende de mudança no backend — já cadastra e cobra hoje.
- ✅ Basta ligar Landing Page e Checkout pra lerem o plano real do Admin (3 arquivos de frontend).
- ❌ Perde o "desconto à vista no PIX" que hoje existe fixo no código (R$99,90 PIX vs R$154,80 cartão parcelado).

### Opção B — Preço por método de pagamento, sem mexer no backend (contorno)
Cadastrar **dois planos** no Admin pra cada promoção (ex: `natal-pix` R$20 e `natal-cartao` R$120), com uma convenção de nome pro sistema saber que são o "mesmo" plano em dois métodos.
- ✅ Funciona hoje, sem depender do time de backend.
- ❌ Fica estranho na tela do Admin (aparecem como 2 planos separados, 2 contadores de assinante, etc. em vez de 1 card só).
- ❌ Precisa de disciplina ao cadastrar (nome errado quebra a promoção).

### Opção C — Adicionar campos de preço por método no backend (correto)
O time de backend adiciona 2 campos no cadastro de plano: `pricePix` e `priceCard` (ou similar).
- ✅ Solução limpa: 1 plano, 2 preços, tudo pelo mesmo card no Admin.
- ✅ Resolve de vez a pendência já registrada na Correção #006.
- ❌ Depende de outro time/repositório (não é algo que o frontend resolve sozinho).

---

## Recomendação

Curto prazo: **Opção A**, pra já eliminar o problema mais grave (hoje o Admin de Planos é 100% decorativo — nada do que se configura lá afeta o que o cliente vê ou paga). Isso já entrega "mudar preço sem chamar o dev" pro caso comum (1 preço, promoção geral).

Médio prazo: **Opção C**, pra viabilizar promoções com desconto à vista no PIX (como o exemplo do Natal) sem gambiarra de plano duplicado.

---

## Resumo para decisão do cliente

- [ ] Aprovar Opção A agora (preço único, rápido)
- [ ] Aguardar Opção C antes de liberar (preço por método, mais completo, depende do backend)
- [ ] Usar Opção B como contorno temporário até a Opção C ficar pronta
