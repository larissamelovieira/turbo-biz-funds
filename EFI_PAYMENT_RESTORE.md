# Restaurar Integração de Pagamento EFI Bank

## Status
**Desabilitado temporariamente** — Problema na EFI Bank com bancos parceiros (junho 2026).
Pagamentos via cartão e PIX estão retornando erro 503/falha no processamento.

## O que está esperando para voltar

### 1. Testar se EFI Bank voltou a funcionar
Antes de qualquer coisa, testar manualmente via sandbox:
```bash
# Verificar se tokenização de cartão está funcionando no sandbox EFI
# Acessar painel EFI: https://sandbox.efi.com.br
# Testar endpoint de pagamento com cartão de teste
```

### 2. Verificar variáveis de ambiente na Vercel
```
VITE_EFI_CLIENT_ID      — client ID da conta EFI Bank
VITE_EFI_PAYEE_CODE     — código do recebedor EFI
VITE_EFI_ENV            — "sandbox" ou "production"
```

### 3. Arquivo principal de pagamento
`src/pages/Pagamento.tsx`

- **CardForm** (linha ~194): formulário de cartão com tokenização via `EfiPay.CreditCard`
- **PixForm** (linha ~441): QR Code PIX gerado via API backend
- **createPixIntent** (linha ~624): POST `/v1/payments/intent` com `method: "pix"`
- **handleCardSubmit** (linha ~718): POST `/v1/payments/intent` + confirm

### 4. Fluxo de pagamento completo
```
Usuário → Cadastro → /pagamento → escolhe PIX ou Cartão
  PIX:    POST /v1/payments/intent (method: pix) → QR Code → polling 5s → aprovado → /pagamento-sucesso
  Cartão: EfiPay tokeniza → POST /v1/payments/intent (method: cartao) → POST /v1/payments/:id/confirm → aprovado → /pagamento-sucesso
```

### 5. Erros conhecidos durante a falha EFI
- `ServiceUnavailableException` / status 503 do backend
- Tokenização do cartão falha no `EfiPay.CreditCard.getPaymentToken()`
- PIX intent criado mas QR Code não gerado (campo `qrCodeBase64` nulo)
- Polling PIX retorna status indefinido indefinidamente

### 6. Endpoint do backend para investigar
`POST /v1/payments/intent` — se retornar 503, problema ainda no EFI
Verificar logs no backend junto ao time.

### 7. Após EFI voltar
1. Testar sandbox com cartão de teste: `4111 1111 1111 1111`
2. Testar PIX no sandbox
3. Remover `BACKEND_503_DEBUG.md` da raiz se ainda existir
4. Fazer deploy em produção
5. Monitorar primeiros pagamentos no painel EFI Bank

## Contato EFI Bank
- Suporte: https://dev.efipay.com.br/
- Status da plataforma: verificar canal oficial EFI
