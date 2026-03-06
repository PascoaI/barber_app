# Política de Paridade (root, legacy e public)

Para evitar divergência entre ambientes (Next e estático legado), **toda alteração visual/markup** deve ser espelhada nos pares abaixo:

- `*.html` da raiz **e** `legacy/*.html`
- `script.js` **e** `public/script.js`
- `styles.css` **e** `public/styles.css`

## Checklist obrigatório

1. Alterou um HTML na raiz? Espelhe em `legacy/` com o mesmo conteúdo.
2. Alterou `script.js`? Espelhe em `public/script.js`.
3. Alterou `styles.css`? Espelhe em `public/styles.css`.
4. Execute a verificação de paridade:

```bash
npm run check:parity
```

## Objetivo

Garantir que os mesmos fluxos funcionem de forma consistente em:

- ambiente servido por Next.js (rewrites e rotas App Router)
- ambiente servido por HTML estático legado
