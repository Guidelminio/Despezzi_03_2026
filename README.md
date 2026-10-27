# Despezi

## Gestão financeira pessoal, objetivos e organização do orçamento

O **Despezi** é um protótipo acadêmico para registrar receitas e despesas, acompanhar limites por categoria e planejar objetivos individuais de poupança. A entrega desta branch é voltada a uma demonstração local controlada, com dados fictícios — não a uso financeiro real ou exposição pública.

> **Estado:** protótipo funcional em desenvolvimento. As rotas de transações, objetivos e limites continuam sob autenticação Node/Express; um worker Python interno acrescenta insights determinísticos. O projeto ainda não está aprovado para produção.

> **Esta cópia de entrega:** está baseada em `fd97883` na branch `fix/security-and-financial-charts`, com as alterações do MVP neste working tree. Elas ainda não foram commitadas nem enviadas ao GitHub; clonar a branch remota neste momento não baixa estas alterações. Para a máquina da apresentação, use a pasta/arquivo de código desta entrega.

## O que o sistema faz

1. Permite criar uma conta temporária e entrar com e-mail e senha; o login Google é opcional e não é necessário para a demo.
2. Registra receitas e despesas concluídas com valor, descrição, data, categoria e forma de pagamento.
3. Calcula totais e saldo acumulado com base nas movimentações registradas.
4. Permite criar, atualizar e remover limites mensais por categoria de despesa.
5. Permite criar objetivos individuais de poupança com nome, motivo privado, valor-alvo, valor já juntado, prazo e/ou aporte mensal.
6. Mostra progresso e cálculos lineares explicáveis para os objetivos, sem presumir renda, juros ou rendimento.
7. Apresenta insights determinísticos sobre o uso dos limites e os planos de objetivos. Um insight não garante resultados nem altera limites ou orçamento.
8. Consulta despesas por categoria e compara receitas e despesas nas seis competências mais recentes.
9. Exporta transações e relatórios para CSV; relatórios também podem ser exportados em PDF.

Objetivos de poupança e limites de gasto são conceitos separados. O motivo privado do objetivo só é retornado pelas rotas autenticadas da própria conta. O sistema não oferece aconselhamento financeiro, integração bancária, crédito, financiamento, investimento, catálogo de bens ou colaboração entre contas.

## Arquitetura

```text
React 19 + TypeScript + Vite
              │ HTTP/JSON
              ▼
Node.js + Express
  autenticação/autorização
  regras e única camada dona do SQLite
     │ SQL                 │ JSON agregado por stdin (sob demanda)
     ▼                     ▼
SQLite via better-sqlite3   Worker Python (stdlib)
                           sem SQLite, rede ou persistência
```

- **Frontend:** React, Vite, React Router, Tailwind CSS, Recharts, Motion, Lucide e Sonner.
- **Backend:** Node.js 20+, TypeScript, Express e `tsx`. O mínimo acompanha a versão corrigida do Nodemailer.
- **Banco:** SQLite via `better-sqlite3`; `DATABASE_PATH` seleciona o arquivo. A aplicação Node é a única camada que abre o banco.
- **Worker analítico:** Python 3.9+ e biblioteca padrão. O Node consulta somente dados do usuário autenticado, reduz os dados a percentuais agregados de utilização dos limites e contagens de estado dos objetivos e passa JSON por `stdin`. O payload não contém token, e-mail, nome, IDs persistentes, descrição de transação, motivo privado, linhas de transação ou caminho do banco.
- **Contrato do worker:** `contract_version: 1`, tamanho de entrada limitado, categorias/contagens/percentuais validados, argumentos fixos e `spawn` com `shell: false`; o processo tem timeout, limites de saída e concorrência. O Python não consulta SQLite, não grava dados, não atende conexões de rede e não emite logs com valores financeiros.
- **Falha isolada:** se Python estiver ausente, exceder o timeout ou devolver saída inválida, `/api/insights` retorna insights vazios com `degraded: true`. Transações, objetivos, limites, estatísticas e relatórios continuam sob as regras Node existentes.
- **Hardening de autenticação:** OAuth usa `state` aleatório de uso único, cookie `HttpOnly`/`SameSite=Lax`, PKCE S256 e validação da origem/janela que recebe `postMessage`. E-mail exige validação estrita do destinatário e TLS. O modo de apresentação desativa OAuth e SMTP.

A antiga rotina insegura em `analytics.py` foi substituída por uma entrada de compatibilidade que encaminha JSON ao worker puro em `worker/insights_worker.py`; ela não abre banco nem grava resultados. Não existe tabela `analytics_results` e não é criada por esta implementação. Os cálculos financeiros centrais de totais, saldo, competências e gráficos continuam em TypeScript.

## Modelo de dados

| Tabela | Responsabilidade |
|---|---|
| `users` | Conta, hash da senha e papel; a coluna legada `investor_profile` continua preservada, mas não é exposta no fluxo da demonstração. |
| `transactions` | Movimentações financeiras do usuário. |
| `spending_goals` | Limites mensais por categoria de despesa. |
| `savings_goals` | Objetivos pessoais; valores monetários em centavos inteiros e motivo privado. |
| `goal_alerts` | Registro de alertas de limites por usuário, categoria e competência. |
| `password_resets` | Hash de token temporário de redefinição e validade. |

A rota de estatísticas considera apenas movimentações com `status = 'completed'`. O saldo é calculado como receitas menos despesas, sem saldo inicial. Os valores de `transactions.amount` permanecem no schema atual como `REAL`; esta entrega não faz migração.

## Rotas principais

Todas as rotas abaixo, exceto as rotas públicas de autenticação, exigem `Authorization: Bearer <token>`.

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/api/auth/register` | Criar conta. |
| `POST` | `/api/auth/login` | Iniciar sessão. |
| `GET` | `/api/auth/me` | Consultar usuário atual. |
| `POST` | `/api/auth/logout` | Revogar sessão atual. |
| `POST` | `/api/auth/forgot-password` | Solicitar recuperação. |
| `POST` | `/api/auth/reset-password` | Redefinir senha com token válido. |
| `GET/POST/DELETE` | `/api/transactions` e `/api/transactions/:id` | Listar, criar e remover movimentações próprias. |
| `GET/POST/DELETE` | `/api/goals` e `/api/goals/:category` | Listar, definir/atualizar e remover limites próprios. |
| `GET/POST` | `/api/savings-goals` | Listar e criar objetivos próprios. |
| `PUT/DELETE` | `/api/savings-goals/:id` | Editar ou remover objetivo próprio. |
| `GET` | `/api/insights` | Solicitar insights agregados do usuário autenticado; falha do worker é degradada. |
| `GET` | `/api/stats` | Consultar indicadores e séries financeiras próprias, calculadas em TypeScript. |
| `GET` | `/api/admin/stats` | Consultar indicadores administrativos. |
| `GET/POST` | `/api/admin/users/:id/transactions` | Consultar ou criar movimentação como administrador. |
| `PUT/DELETE` | `/api/admin/transactions/:txId` | Editar ou remover movimentação como administrador. |
| `DELETE` | `/api/admin/users/:id` | Remover conta comum e dados relacionados. |

O antigo endpoint `POST /api/users/profile` foi removido. A URL de interface `/perfil-investidor` redireciona ao painel; a coluna `users.investor_profile` e sua migração compatível permanecem no schema, sem `DROP COLUMN` ou limpeza de valores.

## Executar localmente

### Pré-requisitos

- Node.js 20 ou superior e npm.
- Python 3.9 ou superior (biblioteca padrão; sem `pip install`). O padrão é `python3` em Linux/macOS e `python` no Windows. Se o executável não estiver no `PATH`, configure `PYTHON_EXECUTABLE` no `.env` como o caminho do interpretador, sem argumentos.
- Navegador moderno.

### Instalação e execução

Linux/macOS:

```bash
npm ci
cp .env.example .env
npm run dev
```

Windows PowerShell:

```powershell
Set-Location "C:\caminho\do\projeto"
npm ci
Copy-Item .env.example .env
# Se necessário, edite .env e defina PYTHON_EXECUTABLE=python
npm run dev
```

A aplicação abre em `http://localhost:3000`. O servidor de desenvolvimento fica ligado a `127.0.0.1` por padrão. O Node cria o schema e chama o worker apenas quando o painel solicita insights. Não são criadas contas de demonstração com senha fixa. Cadastre uma conta temporária pela interface e use somente nomes, lançamentos, objetivos e motivos fictícios.

### Apresentar no computador e abrir no celular

Para o passo a passo do dia, consulte o [guia de apresentação](GUIA_DIA_DA_APRESENTACAO.md).

Não é necessário baixar nem instalar um aplicativo no celular: a interface é responsiva e abre no navegador. No computador da apresentação, conectado à mesma rede Wi-Fi privada do celular, instale as dependências uma vez e execute:

```bash
npm ci
npm run presentation
```

O comando exige Node.js 20+, compila a interface para produção, serve os arquivos estáticos pelo próprio Node e cria/usa `database-presentation.sqlite`, separado do banco padrão. Ele anuncia `http://localhost:3000` para o computador e os IPv4 privados encontrados para o celular. No telefone, escolha o endereço correspondente à mesma rede e abra-o no navegador. Esta entrega abre o site responsivo no navegador; não instala um app nativo nem habilita funcionamento offline.

Se o Firewall do Windows bloquear o telefone, um administrador pode criar uma exceção restrita ao perfil privado e à sub-rede local:

```powershell
New-NetFirewallRule -DisplayName "Despezi Demo 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private -RemoteAddress LocalSubnet
# Após a apresentação, remova a regra opcional:
Remove-NetFirewallRule -DisplayName "Despezi Demo 3000"
```

O modo de apresentação usa dados fictícios, ativa headers/CSP, desativa Google OAuth e envio de e-mails e não inicia o servidor Vite/HMR. O Python continua como processo filho do Node e não abre porta. O arquivo `database-presentation.sqlite` permanece entre execuções; pare o servidor e remova apenas esse arquivo (e `-wal`/`-shm`, se existirem) depois da apresentação. Não encaminhe portas, não crie túnel público e autorize a porta 3000 somente no perfil privado do firewall. A rede local continua usando HTTP: utilize uma rede confiável e nunca insira dados financeiros reais.

### Instalador Windows

O [instalador 1.0.1 para Windows 10/11 x64](release/Despezi-Setup-1.0.1.exe) está versionado junto com o [SHA-256](release/SHA256SUMS.txt) e as [instruções](release/README.md). Ele tem 67.593.935 bytes e adiciona aproximadamente 67,6 MB ao histórico do repositório e aos clones futuros. O EXE não tem assinatura Authenticode; confira o hash antes de executar e não desative o Defender. É uma demo local, em HTTP, com Google OAuth e SMTP desligados; use apenas dados fictícios e não exponha a porta à Internet.

### Banco descartável e reset seguro

Para uma demonstração isolada, use um arquivo descartável distinto do banco padrão:

```bash
# Linux/macOS
DATABASE_PATH=./database-demo.sqlite npm run dev
```

```powershell
# Windows PowerShell
$env:DATABASE_PATH = ".\database-demo.sqlite"
npm run dev
```

Para resetar, primeiro pare o servidor e confirme que `DATABASE_PATH` aponta apenas para o arquivo descartável de demonstração. Faça backup se precisar guardar a demo; então remova esse arquivo e, se existirem, seus arquivos `-wal`/`-shm`. **Não remova `database.sqlite` ou qualquer banco que contenha dados a preservar.** O repositório ignora bancos locais no Git.

### Acesso por celular ou computador na mesma LAN

Para uso local normal, o bind padrão é `127.0.0.1` e não aceita conexões de outros aparelhos. Use `npm run presentation` para habilitar o bind em `0.0.0.0` somente de forma explícita e servir o build estático. O celular e o computador precisam estar na mesma rede privada; redes de convidados podem bloquear comunicação entre dispositivos. Se necessário, crie uma regra de entrada no firewall restrita ao perfil **Private** e à sub-rede local. Não use perfil público, encaminhamento de portas, túnel ou URL pública. O acesso por LAN deve ser ensaiado no computador e telefone usados no dia; a validação no Sandbox não comprova conectividade física.

### E-mail e OAuth

Para redefinição de senha e alertas por e-mail, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e, opcionalmente, `SMTP_FROM`. O transporte exige TLS (TLS implícito em 465 ou STARTTLS nas demais portas configuradas), rejeita certificados inválidos e desabilita leitura de arquivo/URL em mensagens. Sem SMTP, a resposta de recuperação continua genérica por privacidade, mas nenhum e-mail é enviado. O modo de apresentação não envia e-mails mesmo se `.env` possuir credenciais.

Para login Google, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `APP_URL` com a origem exata cadastrada no Google. A demo desativa esse fluxo e deve usar cadastro local fictício. O callback OAuth com `state`/PKCE foi coberto por testes locais, mas a integração com uma aplicação Google real e as URLs autorizadas não foram testadas.

## Qualidade

```bash
npm run lint       # TypeScript
npm test            # testes Node, API integrada com SQLite descartável e testes Python
npm run test:python # somente testes Python
npm run build       # build da interface
```

Os testes integrados criam bancos e contas temporários; não usam nem alteram o banco local real. `npm run build` pode reportar um bundle principal acima de 500 kB; o aviso deve ser medido e acompanhado, mas não muda a arquitetura deste MVP.

## Auditoria de dependências

Em 22/10/2026, `npm audit` reportou **0 vulnerabilidades conhecidas** após atualizar Nodemailer para 10.2.1, `qs` para 6.16.1 por override, e `tsx`/`esbuild` para versões corrigidas. Nodemailer 10 exige Node.js 20+, declarado em `package.json`. A auditoria é um retrato do registro npm nessa data, não uma certificação nem garantia de segurança do código.

## Estrutura principal

```text
server.ts
analytics.py                 # shim compatível, sem acesso a banco
worker/insights_worker.py    # worker puro, stdin/stdout JSON
src/
  components/       # navegação, modais e componentes de interface
  context/          # autenticação e tema
  data/             # categorias e formas de pagamento
  pages/            # painel, transações, orçamento e objetivos
  security/         # armazenamento/verificação de senha
  services/         # estatísticas, cálculos e integração com o worker
  utils/            # políticas, datas e CSV
  db.ts             # schema SQLite e configuração do banco
tests/              # testes Node/API e Python
scripts/test-python.mjs
.env.example
package.json
```

## Limitações e próximos passos

1. **Sessões e transporte:** tokens ainda ficam em `localStorage`; HTTP na LAN não cifra credenciais nem sessões. Use apenas Wi-Fi privada confiável, contas descartáveis e dados fictícios. HTTPS e cookie de sessão `HttpOnly` são necessários antes de tratar dados reais.
2. **OAuth:** state/PKCE e vínculo da mensagem com o popup foram implementados, mas o fluxo não foi validado com credenciais reais do Google; a apresentação o desativa.
3. **Banco:** SQLite local não é criptografado em repouso. Use apenas dados fictícios e um arquivo descartável na demonstração.
4. **LAN:** o runner foi iniciado e verificado no Sandbox; o Desktop autorizado estava offline. A conexão pelo telefone físico e as regras reais do firewall ainda precisam ser testadas antes do dia.
5. **Worker:** insights são complementares e descartáveis. Sua indisponibilidade não deve alterar as estatísticas TypeScript nem impedir transações, objetivos ou limites.
6. **Perfil de investidor:** UI, rota de gravação e endpoint foram retirados da demonstração; `investor_profile` permanece como coluna legada para compatibilidade, sem recomendações de produtos.
7. **Entrega acadêmica:** alinhar documentação, diagramas e roteiro de apresentação à versão efetivamente testada.

O Despezi é um protótipo acadêmico; não constitui aconselhamento financeiro e não promete que qualquer objetivo será alcançado.
