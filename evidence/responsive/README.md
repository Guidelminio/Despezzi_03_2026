# Evidências de QA responsivo — Despezi

**Execução:** 22/10/2026, branch `fix/security-and-financial-charts`, base conhecida `fd97883`. O servidor de desenvolvimento foi iniciado em `http://localhost:3000` com `/tmp/despezi-demo-20261022.sqlite`, contendo somente uma conta e lançamentos/objetivos fictícios. O site não foi publicado.

## Capturas

| Viewport/tela | Evidência |
|---|---|
| Celular estreito — painel, 320×568 | [mobile-320-dashboard.png](mobile-320-dashboard.png) |
| Celular — painel, 375×667 | [mobile-375-dashboard.png](mobile-375-dashboard.png) |
| Tablet — painel, 768×1024 | [tablet-768-dashboard.png](tablet-768-dashboard.png) |
| Desktop — painel, 1365×900 | [desktop-1365-dashboard.png](desktop-1365-dashboard.png) |
| Desktop — objetivo com progresso, prazo e aporte | [objective-progress-desktop.webp](objective-progress-desktop.webp) |
| Celular — transações, 320×568 | [mobile-320-transactions.png](mobile-320-transactions.png) |
| Celular — orçamento, 320×568 | [mobile-320-budget.png](mobile-320-budget.png) |
| Celular — objetivos, 320×568 | [mobile-320-savings-goals.png](mobile-320-savings-goals.png) |
| Celular — relatórios, 320×568 | [mobile-320-reports.png](mobile-320-reports.png) |

## Resultados

- O Chromium 154 percorreu 5 rotas (`/dashboard`, `/transactions`, `/goals`, `/savings-goals` e `/reports`) em quatro viewports, totalizando **20 combinações**. Não houve overflow horizontal no documento em nenhuma delas. A tabela de transações mantém uma rolagem horizontal interna própria em telas estreitas.
- Os indicadores do painel foram ajustados para duas colunas no breakpoint de tablet; o gráfico mensal de relatórios usa rótulos abreviados no celular e não aumenta a largura da página.
- Navegação por Tab foi exercitada. O diálogo de exclusão possui semântica de diálogo e título acessível, recebe foco ao abrir, contém Tab/Shift+Tab, fecha com Escape e retorna o foco ao botão que o abriu. Nenhuma transação foi apagada neste teste.
- A rota antiga `/perfil-investidor` redirecionou ao painel. O teste final não registrou exceções JavaScript.
- O Node respondeu em `0.0.0.0:3000`; não foi encontrada porta de rede do worker Python. O console remoto usado somente para automação Chromium escutou em loopback `127.0.0.1:9333` e foi encerrado após a captura.

Os números detalhados estão em [viewport-results.json](viewport-results.json). Este é um teste automatizado de viewport em Chromium, **não** um teste em celular/tablet físico, uma auditoria completa WCAG ou um teste com leitor de tela. O Desktop autorizado estava offline, então não foi possível validar a conexão LAN a partir de um segundo aparelho. A requisição convencional por `/favicon.ico` responde 404 porque a aplicação ainda não inclui esse recurso; isso não impede os fluxos funcionais testados.
