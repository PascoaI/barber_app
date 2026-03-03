# npm install - troubleshooting (Next.js migration)

## Sintoma encontrado
`npm install` falha com `E403 Forbidden` ao baixar pacotes do npm (`next`, `react`, `@types/node`, etc.).

## Evidência
No log de npm:
- `GET https://registry.npmjs.org/next -> 403`
- `GET https://registry.npmjs.org/@types%2fnode -> 403`

Isso indica bloqueio de rede/política no registry, não erro do código da aplicação.

## O que você precisa fazer no seu ambiente
1. **Liberar acesso de rede** ao registry npm (ou usar registry corporativo permitido).
2. **Configurar autenticação** no registry corporativo (token de leitura), se exigido.
3. **Configurar proxy** corretamente, se sua rede exige proxy HTTPS.

## Passo a passo rápido
1. Copie configuração base:
   ```bash
   cp .npmrc.example .npmrc
   ```
2. Ajuste `.npmrc` com seu registry/token/proxy.
3. Exporte token (quando aplicável):
   ```bash
   export NPM_TOKEN=seu_token_de_leitura
   ```
4. Valide acesso:
   ```bash
   ./scripts/check-npm-access.sh
   ```
5. Instale dependências:
   ```bash
   npm install
   ```

## Depois disso
Com `npm install` funcionando, rode:
```bash
npm run dev
npm run build
```
