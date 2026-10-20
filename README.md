# Despezi

## Gestão financeira pessoal, objetivos e organização do orçamento

O **Despezi** é um protótipo acadêmico de gestão financeira pessoal para o Trabalho de Conclusão de Curso do Técnico em Informática Integrado. Centraliza o registro de receitas e despesas, ajuda a acompanhar limites por categoria e permite planejar objetivos individuais de poupança.

> **Estado:** protótipo funcional. As alterações desta branch reforçam a autenticação, validam dados no servidor e corrigem cálculos e rótulos dos gráficos. Ainda não é adequado para guardar dados financeiros reais ou ser exposto publicamente sem concluir os itens de segurança e entrega indicados abaixo.

## O que o sistema faz

1. O usuário cria uma conta ou entra com e-mail e senha; o login Google é opcional e depende de configuração externa.
2. Registra receitas e despesas concluídas com valor, descrição, data, categoria e forma de pagamento.
3. Consulta totais e saldo acumulado a partir das movimentações registradas.
4. Define limites mensais próprios por categoria de despesa e acompanha alertas de proximidade/excesso.
5. Cria objetivos de poupança com nome, motivo privado, valor-alvo, valor já juntado e prazo desejado ou aporte mensal.
6. Recebe cálculos lineares transparentes de aporte necessário, previsão de conclusão e insuficiência do plano informado.
7. Consulta despesas por categoria no histórico e compara receitas e despesas nas seis competências mais recentes.
8. Exporta transações e relatórios para CSV; relatórios também podem ser exportados em PDF.

Objetivos de poupança e limites de gasto são conceitos separados. O sistema não altera um limite nem compartilha o motivo privado de um objetivo com outra conta. Os cálculos não presumem juros, rendimento, inflação, valorização de bens, financiamento ou aprovação de crédito.

## Funcionalidades

### Autenticação e acesso

- Cadastro, login, consulta da sessão e logout.
- Senhas armazenadas com `scrypt`, salt aleatório e formato versionado; senhas em texto puro de bancos antigos são migradas na inicialização.
- Recuperação por token aleatório de uso único, com validade de uma hora; o banco guarda o hash do token.
- Limites básicos de tentativas em cadastro, login e recuperação.
- Sessões mantidas em memória no servidor, com expiração após 12 horas. A interface mantém o token em `localStorage`.
- Isolamento das transações, limites e objetivos pelo `user_id` autenticado.

### Transações

- Criação de receitas e despesas com valores positivos e precisão de até duas casas decimais.
- Validação de data civil, tipo, categoria, forma de pagamento e descrição na API.
- Histórico com filtros, ordenação e exclusão pelo próprio usuário.
- Exportação CSV em UTF-8 com BOM, delimitador adequado ao locale pt-BR e escape de campos.

### Orçamento por categoria

- Um limite mensal por categoria de despesa, definido pelo usuário.
- Criação, atualização e remoção pelo próprio usuário.
- Progresso baseado em despesas concluídas da competência corrente, no fuso configurado.
- Alertas a partir de 80% e 100%. E-mail só é enviado quando SMTP está configurado; sem SMTP, o conteúdo e o link de recuperação não são escritos no console.

### Objetivos de poupança

- CRUD de objetivos por usuário, com nome, motivo, valor-alvo, valor acumulado e prazo/aporte opcional.
- Valores persistidos como centavos inteiros.
- Com prazo, o sistema calcula o aporte mensal necessário; com aporte, estima o prazo; com ambos, verifica se o plano cobre o objetivo na data escolhida.
- Atualização do valor juntado e progresso visual.
- O motivo é retornado somente pelas rotas autenticadas do próprio usuário; a interface administrativa não consulta essa tabela.
- Soma dos aportes planejados apresentada como referência — não como confirmação de renda disponível.

### Dashboard e relatórios

- Totais de receitas, despesas e saldo acumulado a partir de movimentações concluídas.
- Gráfico de saldo acumulado por lançamento, começando em zero porque o produto ainda não registra saldo inicial.
- Gráfico por categoria referente a todo o histórico concluído.
- Comparação dos últimos seis meses-calendário, incluindo competências sem movimento.
- Rótulos de datas civis sem deslocamento de fuso e moeda em BRL.

### Administração

- Painel protegido por função administrativa para métricas agregadas e manutenção de contas/transações.
- A exclusão de uma conta remove em transação as transações, objetivos, limites, alertas e tokens de recuperação associados.

## Arquitetura

```text
React 19 + React Router + Tailwind CSS + Recharts
                  │ HTTP/JSON
                  ▼
        Node.js + Express + Vite
        validação, autenticação e regras
                  │ SQL
                  ▼
       SQLite local + better-sqlite3
```

- **Frontend:** React, Vite, React Router, Tailwind, Recharts, Motion, Lucide e Sonner.
- **Backend:** Node.js, TypeScript, Express e `tsx`.
- **Banco:** SQLite via `better-sqlite3`; `DATABASE_PATH` permite escolher arquivo local ou temporário de teste.
- **E-mail e OAuth:** Nodemailer e Google OAuth, opcionais.
- **Exportação:** `jspdf`/`jspdf-autotable` e gerador CSV local.

## Modelo de dados

| Tabela | Responsabilidade |
|---|---|
| `users` | Nome, e-mail, hash da senha, função e perfil de investidor. |
| `transactions` | Movimentações financeiras do usuário. |
| `spending_goals` | Limites mensais de despesas por categoria. |
| `savings_goals` | Objetivos pessoais de poupança; valores monetários em centavos inteiros. |
| `goal_alerts` | Registro de alertas de limites por usuário, categoria e competência. |
| `password_resets` | Hash de token temporário de redefinição e validade. |

A rota de estatísticas considera apenas movimentações com `status = 'completed'`. O saldo é calculado como receitas menos despesas, sem saldo inicial.

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
| `GET` | `/api/transactions` | Listar movimentações próprias. |
| `POST` | `/api/transactions` | Criar movimentação. |
| `DELETE` | `/api/transactions/:id` | Remover movimentação própria. |
| `GET/POST/DELETE` | `/api/goals` e `/api/goals/:category` | Listar, definir/atualizar e remover limites de gastos. |
| `GET/POST` | `/api/savings-goals` | Listar e criar objetivos próprios. |
| `PUT/DELETE` | `/api/savings-goals/:id` | Editar ou remover objetivo próprio. |
| `GET` | `/api/stats` | Consultar indicadores e séries temporais. |
| `POST` | `/api/users/profile` | Salvar perfil de investidor. |
| `GET` | `/api/admin/stats` | Consultar indicadores administrativos. |
| `GET/POST` | `/api/admin/users/:id/transactions` | Consultar ou criar movimentação como administrador. |
| `PUT/DELETE` | `/api/admin/transactions/:txId` | Editar ou remover movimentação como administrador. |
| `DELETE` | `/api/admin/users/:id` | Remover conta comum e dados relacionados. |

## Executar localmente

### Pré-requisitos

- Node.js 18 ou superior e npm.
- Navegador moderno.

### Instalação e execução

```bash
git clone https://github.com/Guidelminio/Despezzi_03_2026.git
cd Despezzi_03_2026
npm ci
cp .env.example .env
npm run dev
```

A aplicação abre em `http://localhost:3000`. A primeira inicialização cria as tabelas necessárias e não cria usuários de demonstração com credenciais fixas. `DATABASE_PATH` define o banco local; os arquivos SQLite estão excluídos do Git.

Para redefinição de senha e alertas por e-mail, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e, opcionalmente, `SMTP_FROM` em `.env`. Sem SMTP, o endpoint de recuperação mantém resposta genérica por privacidade, mas nenhum e-mail é enviado; não há link de recuperação disponível. Não registre o link/token em logs.

Para login Google, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `APP_URL`. A integração ainda precisa de revisão de `state`/PKCE e validação de domínio/origem antes de uma publicação real.

### Qualidade

```bash
npm run lint   # TypeScript
npm test       # testes unitários de segurança, cálculo, validação, datas e CSV
npm run build  # build da interface
```

## Estrutura principal

```text
server.ts
src/
  components/       # navegação, modais e componentes de interface
  context/          # autenticação e tema
  data/             # catálogos canônicos de categorias e pagamento
  pages/            # painel, transações, orçamento e objetivos
  security/         # armazenamento/verificação de senha
  services/         # estatísticas, cálculos e e-mail
  utils/            # política de senha, datas e CSV
  db.ts             # esquema SQLite e configuração do banco
tests/              # testes Node/tsx
.env.example
package.json
```

## Limitações e próximos passos antes de produção/entrega

1. **Sessões:** tokens ainda ficam em `localStorage` e a sessão é somente em memória; considerar cookies `HttpOnly`, `Secure`, `SameSite` e armazenamento persistente, com proteção CSRF.
2. **OAuth:** implementar `state`/PKCE e validar `email_verified`, origens e URLs autorizadas.
3. **Bancos existentes:** a migração transforma senhas legadas em hashes, mas não torna seguras credenciais de demonstração que já tenham sido divulgadas. Excluir/rotacionar contas de teste antigas antes de hospedar o sistema.
4. **E-mail:** testar SMTP real de ponta a ponta, configurar domínio/remetente e monitorar falhas sem expor tokens.
5. **Requisitos acadêmicos:** confirmar com o orientador se Python e JWT são exigências; `analytics.py` é um protótipo separado e as estatísticas ativas são calculadas em Node.js.
6. **Testes e entrega:** executar testes de interface, privacidade entre contas, acessibilidade e demonstração; alinhar texto, diagramas, relatório e slides à versão congelada.

O repositório contém um protótipo acadêmico; não constitui aconselhamento financeiro e não promete que qualquer objetivo será alcançado.
