# Requisito backend: reset de senha sem depender de envio de email

## Contexto

Fluxo atual de "esqueci minha senha" depende de email:

1. Frontend chama `POST /v1/auth/forgot-password` com `{ email }`.
2. Backend sempre responde `200` com mensagem genérica, **para qualquer email**, exista ou não na base — proteção anti-enumeração:
   ```json
   { "message": "Se este e-mail estiver cadastrado, você receberá as instruções em breve." }
   ```
3. Se o email existir, backend deveria enviar um email com link `.../redefinir-senha?token=XXXX`.
4. Frontend chama `POST /v1/auth/reset-password` com `{ token, password }` pra efetivar a troca.

**Problema:** hoje não há serviço de email configurado/funcionando neste ambiente. Passo 3 nunca acontece, então o usuário nunca recebe o token e nunca chega no passo 4. O fluxo trava — não é bug de frontend, é dependência de infra ausente.

## Testes feitos (confirmando o problema)

```bash
# Email existente
curl -X POST https://api.doutorcashapp.com.br/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"thiago.n.morgado@gmail.com"}'
# → 200 { "message": "Se este e-mail estiver cadastrado..." }

# Email inexistente
curl -X POST https://api.doutorcashapp.com.br/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nao-existe-teste-xyz@exemplo-invalido.com"}'
# → 200 { "message": "Se este e-mail estiver cadastrado..." }  (idêntico)

# Login com email existente + senha errada
curl -X POST https://api.doutorcashapp.com.br/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"thiago.n.morgado@gmail.com","password":"errada"}'
# → 401 { "message": "Email ou senha inválidos", "code": "INVALID_CREDENTIALS" }

# Login com email inexistente
curl -X POST https://api.doutorcashapp.com.br/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nao-existe-teste-xyz@exemplo-invalido.com","password":"errada"}'
# → 401 { "message": "Email ou senha inválidos", "code": "INVALID_CREDENTIALS" }  (idêntico)
```

Nenhum endpoint atual do backend diferencia "email existe" de "email não existe". Isso é intencional (anti-enumeração) e não deve ser alterado nos endpoints existentes.

## O que o produto quer (requisito de negócio)

Reduzir o fluxo de recuperação de senha para não depender de envio de email: usuário digita o email e, se existir na base, vai direto pra tela de nova senha.

**Trade-off de segurança conhecido e aceito pelo produto:** esse fluxo revela se um email está cadastrado (enumeração) e permite trocar a senha de qualquer conta sabendo só o email, sem provar posse da caixa de entrada. Isso é uma redução deliberada de segurança em troca de simplicidade — decisão do time de produto, não do frontend.

## Endpoints necessários

### 1. Verificar existência de email

```
POST /v1/auth/check-email
Body: { "email": "user@email.com" }

200 → { "exists": true }
200 → { "exists": false }
```

(ou como GET com query param, tanto faz — mas precisa **diferenciar** true/false, ao contrário do forgot-password atual.)

### 2. Redefinir senha diretamente por email (sem token)

```
POST /v1/auth/reset-password-direct
Body: { "email": "user@email.com", "password": "NovaSenha123" }

200 → { "message": "Senha atualizada" }
404 → email não encontrado
422 → senha não atende critérios
```

## Como o frontend vai consumir

Em `src/pages/ForgotPassword.tsx`:

```ts
const { exists } = await api.post(apiEndpoints.auth.checkEmail, { email });
if (exists) {
  navigate(`/redefinir-senha?email=${encodeURIComponent(email)}`);
} else {
  setEmailError("Email não cadastrado");
}
```

Em `src/pages/ResetPassword.tsx`, trocar a origem do identificador de `token` (query param) pra `email` (query param), e o submit final chamar `reset-password-direct` com `{ email, password }` em vez de `{ token, password }`.

## Status

Aguardando implementação desses dois endpoints no backend doutorcashapp antes de mexer no frontend. Nenhuma mudança de frontend foi feita pra esse fluxo específico — o fluxo atual (baseado em email/token) continua no ar como está.
