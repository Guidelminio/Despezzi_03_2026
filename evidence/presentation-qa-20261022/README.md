# Evidências de QA — apresentação local

**Data:** 22/10/2026. **Ambiente:** Sandbox Linux, build estático de produção pelo `npm run presentation`, Chromium 154 e banco fictício `database-presentation.sqlite` ignorado pelo Git.

## Resultado automatizado

- **20 combinações:** 5 rotas (`/dashboard`, `/transactions`, `/goals`, `/savings-goals`, `/reports`) em 320×720, 375×812, 768×1024 e 1365×900.
- **Overflow horizontal da página:** 0 casos.
- **Hierarquia do painel:** os indicadores de saldo, receitas e despesas aparecem antes dos insights em todos os viewports testados.
- **Barra fixa mobile:** o conteúdo rolável recebe 80px de folga no final; o último controle focável ficou no mínimo 33px acima da barra em 320/375px e 41px acima em tablet.
- **Tablet (768px):** sem sidebar desktop; navegação compacta inferior; os três KPIs aparecem na mesma linha.
- **Desktop (1365px):** sidebar visível e navegação inferior oculta.
- **Planejamento:** as abas “Limites de gastos” e “Objetivos de poupança” mostram `aria-current="page"` na rota correta.
- **Teclado/modal:** o diálogo de exclusão abriu; Escape o fechou após a animação e o foco retornou ao botão acionador.
- **Servidor de apresentação:** build estático respondeu HTTP 200 em localhost, enviou CSP e headers Helmet, omitiu `X-Powered-By`, respondeu JSON 404 para rota `/api` inexistente e aplicou `Cache-Control: no-store` à API. O bind de `0.0.0.0` é explícito apenas no runner de apresentação; o servidor padrão usa localhost.

As medições completas, sem tokens nem e-mails, estão em [`results.json`](results.json).

## Capturas

- Painel: [320px](mobile-320-dashboard.png), [768px](tablet-768-dashboard.png), [1365px](desktop-1365-dashboard.png).
- Objetivos de poupança e abas: [320px](mobile-320-savings-goals.png), [768px](tablet-768-savings-goals.png), [1365px](desktop-1365-savings-goals.png).

## Limites da evidência

A matriz e as capturas usam viewports Chromium simulados e dados inteiramente fictícios. O Sandbox não detectou uma interface IPv4 privada e o Desktop autorizado estava offline; portanto, **a conexão de um telefone físico, a configuração real do Firewall do Windows e o acesso pela rede usada na apresentação não foram testados**. Também não foi feita auditoria WCAG completa, leitor de tela ou ensaio físico de toque. O teste não aprova o sistema para produção nem para uso com dados reais.
