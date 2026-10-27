# Documentação técnica do Despezi

**Revisão técnica:** 20 de outubro de 2026. Este documento descreve o código verificado na branch local `fix/security-and-financial-charts` e não deve ser interpretado como aprovação para produção. O projeto continua sendo um protótipo acadêmico.

## 1. Objetivo e escopo

O Despezi é uma aplicação web para registrar receitas e despesas, acompanhar limites mensais de gastos por categoria, consultar indicadores e relatórios e planejar objetivos pessoais de poupança.

A aplicação distingue dois recursos:

- **Limite de gasto:** teto mensal escolhido pela pessoa para uma categoria, como alimentação ou transporte. A pessoa pode cadastrar, atualizar ou remover o limite.
- **Objetivo de poupança:** plano individual para reunir uma quantia, informando nome, motivo, valor-alvo, quanto já juntou e um prazo e/ou aporte mensal. O usuário controla o objetivo, incluindo edição e exclusão.

O sistema não é consultoria financeira. Não importa dados bancários, não avalia crédito, não simula financiamento, não aplica rendimentos, juros ou inflação e não garante que um objetivo será alcançado. Renda ou disponibilidade financeira não é coletada nem inferida pelo módulo atual.

## 2. Arquitetura efetivamente executada

```text
Navegador
  └── React 19 + TypeScript + React Router + Tailwind CSS
       └── HTTP/JSON para a API Express
            └── Node.js + Express 4 (server.ts)
                 ├── validação e regras de negócio
                 ├── autenticação e autorização por usuário
                 └── SQLite local via better-sqlite3

Integrações opcionais: SMTP (Nodemailer) e OAuth Google.
Desenvolvimento/build: Vite 6, com middleware integrado no servidor local.
```

A API mantém os cálculos financeiros centrais em Node.js/TypeScript. O endpoint autenticado `/api/insights` chama sob demanda um worker Python 3.9+ de biblioteca padrão por `child_process.spawn`, `shell: false` e JSON via stdin. O Node continua sendo a única camada que autentica, consulta o SQLite e autoriza por `user_id`; o worker recebe apenas percentuais agregados de limites e contagens do estado dos objetivos, nunca tokens, nomes, e-mails, IDs persistentes, descrições, motivos privados ou caminho do banco.

O worker em `worker/insights_worker.py` valida contrato versão 1, aplica limites de entrada/saída, timeout e concorrência, não importa SQLite, não abre arquivos de dados, não atende rede e não grava resultados. `analytics.py` é apenas uma entrada de compatibilidade que encaminha stdin ao worker seguro; não há tabela `analytics_results`. Se o processo falhar, `/api/insights` informa estado degradado sem alterar estatísticas, transações, objetivos ou limites. A autenticação continua usando tokens UUID e sessões em memória; não há JWT nem autenticação duplicada no Python.

## 3. Modelo de dados

| Tabela | Dados principais | Uso |
|---|---|---|
| `users` | `id`, nome, e-mail, `password`, papel e coluna legada `investor_profile` | Conta e autorização. A coluna legada é preservada, mas não é exposta na demonstração. O conteúdo de `password` é um hash scrypt versionado, não a senha em texto claro. |
| `transactions` | usuário, tipo, valor positivo, descrição, data, categoria, pagamento e status | Movimentações financeiras. O valor é armazenado como `REAL`; cálculos estatísticos convertem para centavos inteiros durante a operação. |
| `spending_goals` | usuário, categoria e limite positivo | Limites mensais de despesas, um por categoria/usuário. |
| `savings_goals` | usuário, título, motivo, `target_amount_cents`, `amount_saved_cents`, data-alvo e aporte mensal opcional | Objetivos privados de poupança. Valores monetários em centavos inteiros. |
| `goal_alerts` | usuário, categoria, competência e tipo do alerta | Deduplicação de e-mails de limite efetivamente enviados. |
| `password_resets` | usuário, token armazenado como hash em novos fluxos e validade | Recuperação de senha temporária, de uso único. Tokens legados podem ser reconhecidos apenas para migração/compatibilidade e devem expirar. |

As consultas das rotas de objetivos filtram pelo usuário autenticado. O motivo do objetivo não é exposto pela área administrativa. A exclusão administrativa remove os registros dependentes em transação. O SQLite local não é criptografado em repouso; não usar dados financeiros reais.

## 4. Autenticação e proteção de contas

- Senhas novas são armazenadas com `scrypt`, salt aleatório e identificador de versão (`scrypt$v1$...`). A verificação usa comparação segura.
- Na inicialização, senhas antigas em texto claro são convertidas para hashes. É necessário testar a migração sobre cópia de banco antes de atualizar banco que contenha dados que precisem ser preservados.
- Cadastro, login e redefinição aplicam política de 8 a 128 caracteres. Há limites básicos de tentativas em memória, portanto eles não substituem controle de abuso persistente em produção.
- Novos tokens de redefinição são aleatórios, têm validade de uma hora e são guardados como hash. O link não é impresso no console.
- O usuário autentica com token UUID mantido pelo processo por até 12 horas; o token é guardado em `localStorage` no cliente. Reiniciar o servidor encerra as sessões.
- Google OAuth é opcional e exige e-mail verificado e credenciais. Ainda faltam estado `state`/PKCE e revisão completa de origem/retorno antes de produção.

Essas medidas reduzem riscos no protótipo, mas não tornam o sistema adequado para uso financeiro público. Uma implantação real precisa, entre outros requisitos, rever sessões em `localStorage`, armazenamento persistente, cookies `HttpOnly`/`Secure`/`SameSite`, proteção CSRF, TLS, política de privacidade e monitoramento.

## 5. Regras das transações, limites e estatísticas

### Validação de transações

A API aceita apenas tipo `income`/`expense`, valor positivo com até duas casas decimais, data civil ISO válida, categoria correspondente ao catálogo do tipo, método de pagamento permitido e descrição não vazia. Os registros criados são concluídos; lançamentos pendentes não são usados nas estatísticas.

### Limites mensais por categoria

`POST /api/goals` cria ou atualiza por combinação usuário/categoria; a atualização exige a mesma categoria e um novo valor. `DELETE /api/goals/:category` remove o limite do próprio usuário. A API valida categoria de despesa, valor finito positivo e precisão de centavos. A interface calcula uso mensal com despesas concluídas e apresenta avisos visuais a partir de 80% e ao atingir/exceder 100%. E-mails são opcionais e só são marcados como enviados após confirmação de envio pelo SMTP.

### Estatísticas e gráficos

A rota `/api/stats` usa apenas transações concluídas e o fuso `APP_TIME_ZONE` (por padrão, `America/Sao_Paulo`). Valores são acumulados em centavos para evitar erros de ponto flutuante.

- `balance`: total de receitas menos total de despesas de todo o histórico disponível; não existe campo de saldo inicial.
- `chartData`: evolução do saldo acumulado por lançamento, ordenada por data e identificador. A linha de referência em zero é apenas referência visual; o primeiro ponto é o saldo após o primeiro lançamento, não um saldo bancário inicial.
- `categoryExpenses`: despesas por categoria de todo o histórico concluído.
- `currentMonthCategoryExpenses`: despesas concluídas da competência atual, usadas nos limites.
- `monthlyChartData`: seis competências consecutivas, com receitas, despesas e saldo líquido mensais. Meses sem transações aparecem com zero. Datas e competências são formatadas sem converter uma data civil para outro dia por UTC.

CSV usa UTF-8 com BOM, ponto e vírgula e escape de campos para melhor compatibilidade com planilhas em pt-BR. Relatórios em PDF e CSV indicam o escopo temporal de seus dados.

### Worker de insights determinísticos

O Node consulta limites do usuário atual e despesas concluídas do mês em curso, converte o uso em pontos-base e resume os objetivos usando `calculateSavingsGoalPlan` existente. O worker recebe somente `budget_usage` (categoria e pontos-base) e `goals` (contagens de objetivos ativos, concluídos, no prazo, com insuficiência ou sem aporte informado). As regras financeiras continuam autoritativas no TypeScript; o Python gera apenas mensagens determinísticas e versionadas.

O processo filho é chamado com caminho fixo do script, argumentos fixos, modo Python isolado, ambiente reduzido sem `DATABASE_PATH` ou segredos, stdin limitado a 16 KiB, timeout de 2 segundos e no máximo quatro workers concorrentes por processo Node. A resposta JSON é validada antes de chegar ao cliente. Uma falha resulta em `degraded: true` e lista de insights vazia; ela não bloqueia `/api/transactions`, `/api/goals`, `/api/savings-goals` ou `/api/stats`.

## 6. Objetivos de poupança

### Campos e autorização

A API disponibiliza `GET/POST /api/savings-goals` e `PUT/DELETE /api/savings-goals/:id`. As quatro operações exigem autenticação e filtram por `user_id`. Os campos são nome (3–80 caracteres), motivo (1–500), alvo positivo, acumulado entre zero e o alvo, data ISO futura opcional e aporte positivo opcional. É obrigatório informar ao menos prazo ou aporte. Valores monetários são persistidos em centavos.

### Cálculo atual

Considere:

- `restante = max(alvo_centavos − acumulado_centavos, 0)`.
- Com data-alvo, `meses = max(1, diferença entre a competência-alvo e a competência atual)`.
- `aporte_mensal_necessário = teto(restante / meses)` em centavos, arredondando para cima para não ficar alguns centavos abaixo do alvo.
- Se o usuário também informar aporte, o total planejado é `aporte × meses`; a diferença estimada é `max(restante − total_planejado, 0)`.
- Sem prazo, mas com aporte, `meses_estimados = teto(restante / aporte)` e a tela mostra a competência aproximada de conclusão.
- Com acumulado igual ao alvo, o plano é concluído e o aporte necessário é zero.

Exemplo atual: alvo R$ 50.000,00, acumulado R$ 0,00 e diferença de 24 competências mensais resultam em aporte de **R$ 2.083,34 por mês**. O arredondamento para cima cobre os centavos residuais. Se já houver R$ 5.000,00 juntados, o restante será R$ 45.000,00 e o aporte necessário será R$ 1.875,00 por 24 competências.

A interface mostra progresso, restante, prazo/aporte e, quando os dois são informados, suficiência ou diferença do plano. Ela também agrega aportes mensais planejados entre objetivos. Isso não significa que o usuário tenha essa renda disponível.

### Fora do escopo atual

Não há campo para renda nem cálculo de percentual da renda; não existe integração com despesas para recomendar cortes; não há alteração automática de limite; não há catálogo externo de carros/casas, colaboração entre contas, depósito automático, histórico de aportes, IA ou projeção de rendimento. Uma recomendação de mudança de limite, se adicionada depois, deve ser uma simulação explicável e só ser gravada após confirmação do usuário.

## 7. Rotas relevantes

As rotas privadas exigem `Authorization: Bearer <token>`.

| Rota | Finalidade |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Cadastro e autenticação. |
| `GET /api/auth/me`, `POST /api/auth/logout` | Consultar usuário e revogar sessão. |
| `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | Recuperação e redefinição. |
| `GET/POST/DELETE /api/transactions` | Consultar/criar/remover transações próprias. |
| `GET/POST /api/goals`, `DELETE /api/goals/:category` | Listar, criar/atualizar e remover limite mensal próprio. |
| `GET/POST /api/savings-goals`, `PUT/DELETE /api/savings-goals/:id` | CRUD de objetivos de poupança próprios. |
| `GET /api/stats` | Indicadores e séries financeiras próprias. |
| `GET /api/insights` | Insights determinísticos com worker Python interno e falha degradada. |
| `/api/admin/*` | Indicadores e manutenção administrativa, protegidos por papel. |

## 8. Testes e evidências desta revisão

Em 22/10/2026, na branch `fix/security-and-financial-charts`, com base conhecida `fd97883` e dados fictícios em SQLite descartável:

- `npm run lint` — passou (`tsc --noEmit`).
- `npm test` — passou com **24 testes Node** e **5 testes Python**, incluindo integração HTTP/SQLite, isolamento, OAuth state/PKCE, validação de destinatário, bloqueio de SMTP em demo, falha degradada do worker e cálculos financeiros.
- `npm run build` — passou com Vite 6.4.5; o bundle principal tem 1,305 MB minificado (400,68 kB gzip) e ainda aciona o aviso acima de 500 kB, pendência de otimização.
- API real com SQLite temporário — registro e gravação de despesa feitos pela interface; o usuário fictício criou limite de Alimentação de R$ 100 e objetivo de R$ 1.000 com motivo, R$ 100 acumulados, prazo e aporte. O painel apresentou corretamente 85% de uso do limite e insuficiência do aporte, sem mudar orçamento.
- Chromium 154 — matriz de **20 combinações** (painel, transações, limites, objetivos e relatórios em 320×720, 375×812, 768×1024 e 1365×900): zero overflow horizontal da página, KPIs antes dos insights, sem sidebar desktop em tablet e navegação coerente nos objetivos. O último controle focável ficou ao menos 33px acima da navegação fixa mobile após rolagem ao fim. Capturas e medições estão em `evidence/presentation-qa-20261022/`.
- Teclado/modal — o diálogo de exclusão abriu com papel acessível; Escape fechou após a animação e o foco retornou ao botão acionador. Isso é smoke test, não auditoria completa WCAG ou leitor de tela.
- `npm audit` — **0 vulnerabilidades conhecidas** em 22/10/2026 após Nodemailer 10.2.1, `qs` 6.16.1 e atualização de `tsx`/`esbuild`; a versão Nodemailer exige Node 20+.
- O runner `npm run presentation` foi iniciado no Sandbox: build estático respondeu HTTP 200, enviou CSP/headers Helmet, não anunciou `X-Powered-By`, aplicou `no-store` à API e devolveu 404 JSON para rota API inexistente. Somente esse runner usa bind `0.0.0.0`; o servidor de desenvolvimento usa `127.0.0.1`. Python continua sem porta de rede.
- O Desktop autorizado estava offline e o Sandbox não detectou IPv4 privado; conexão de telefone físico, rede Wi-Fi e firewall do computador da apresentação **não foram testados**.

Testes aprovados neste ambiente não constituem resultado de testes com usuários, certificação de segurança ou evidência de implantação pública. A versão final deve repetir os testes no ambiente escolhido para apresentação e guardar evidências.

## 9. Como executar e verificar

```bash
npm ci
cp .env.example .env
npm run dev
npm run lint
npm test
npm run build
```

Node.js 20+ é necessário. `npm run dev` fica restrito a `127.0.0.1`; para demonstrar no computador e acessar pelo telefone na mesma rede privada, use `npm run presentation`. Esse runner compila a interface, serve estáticos com Node, usa `database-presentation.sqlite` e desativa Google OAuth e e-mail. No celular, abra um IPv4 privado anunciado pelo comando. Acesso por LAN permanece HTTP; use dados fictícios e Wi-Fi confiável. O `.env.example` não contém segredos reais. Não versionar `.env` nem bancos locais.

Para esta versão, Python 3.9+ é necessário para os insights, sem instalação de pacotes Python. O padrão é `python3` em Linux/macOS e `python` no Windows; configure `PYTHON_EXECUTABLE` no `.env` se o executável estiver em outro caminho. `npm test` roda testes Node, integração de API em banco temporário e testes unitários Python.

O uso pelo celular é via navegador responsivo, sem instalação de app nativo e sem modo offline. Restringir o firewall à sub-rede local e não encaminhar portas à Internet. O computador e telefone reais da apresentação ainda precisam ser ensaiados juntos.

## 10. Limitações e decisões pendentes

1. A integração Python está implementada como worker complementar, sem duplicar autenticação ou cálculos financeiros centrais. Confirmar com o orientador se existe requisito acadêmico adicional de JWT ou outro contrato.
2. Tokens ainda são armazenados em `localStorage` e o acesso LAN usa HTTP sem criptografia. Cookies `HttpOnly`, proteção CSRF e HTTPS são necessários antes de usar dados reais.
3. OAuth state/PKCE foi testado com credenciais simuladas, mas não com um app Google real; o runner de apresentação o desativa. SQLite não é criptografado em repouso.
4. Repetir a matriz em celular/tablet reais, fazer revisão com leitor de tela e auditar WCAG; a simulação Chromium não certifica conformidade.
5. Otimizar o bundle principal acima de 500 kB e repetir instalação/build no computador Windows da apresentação.
6. A possibilidade de Ollama local está registrada em `OLLAMA_LOCAL_FEASIBILITY.md`; não há integração com IA nesta versão.
7. Manter dados fictícios, backup e instrução de reset da base.

**Conclusão:** o estado atual é um protótipo acadêmico mais verificável que o snapshot original: inclui scrypt, validação de API, cálculos testados de objetivos, estatísticas com competências estáveis e testes automatizados/integrados. Ainda exige validação final, documentação institucional aprovada e hardening de sessão antes de qualquer uso real.
