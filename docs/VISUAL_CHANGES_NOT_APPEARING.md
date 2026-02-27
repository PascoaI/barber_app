# Por que as mudanças visuais não apareciam

## Causa
A navegação principal ainda apontava para páginas legadas (`*.html`) em alguns fluxos, enquanto as alterações visuais recentes foram implementadas em rotas Next (`/client-profile`, `/admin-settings`).

Em ambientes que servem os HTML legados diretamente, essas rotas React não eram abertas automaticamente.

## Correção aplicada
- Links de perfil do cliente foram apontados para `/client-profile`.
- Links de configurações no dashboard admin foram apontados para `/admin-settings`.
- Menu dinâmico do cliente em `script.js` foi atualizado para usar `/client-profile`.

## Resultado esperado
Ao acessar Perfil/Configurações pelos atalhos da interface, agora as páginas Next com o novo visual são abertas consistentemente.
