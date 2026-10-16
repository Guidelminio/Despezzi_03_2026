# Despezi

## Gestão financeira pessoal com organização, metas e análise visual

O **Despezi** é uma aplicação web de gestão financeira pessoal desenvolvida como projeto de Trabalho de Conclusão de Curso do **Técnico em Informática Integrado**. A proposta é centralizar o registro de receitas e despesas, transformar movimentações em indicadores compreensíveis e apoiar decisões financeiras mais conscientes.

O sistema reúne, em um único ambiente, **autenticação**, **dashboard**, **transações**, **metas de gastos**, **relatórios** e **gestão administrativa**. A interface foi organizada para reduzir o atrito entre registrar uma movimentação, consultar o histórico e interpretar o comportamento financeiro.

> **Status:** protótipo funcional para fins acadêmicos. Antes de uma implantação pública, é necessário reforçar a segurança, revisar as credenciais de demonstração e configurar os serviços externos.

## Visão do produto

O problema abordado pelo Despezi é a dispersão das informações financeiras em anotações, aplicativos e planilhas diferentes. A solução concentra os dados em um fluxo único:

1. O usuário cria uma conta ou entra no sistema.
2. Registra receitas e despesas com valor, descrição, data, categoria e forma de pagamento.
3. Consulta o saldo, o fluxo de caixa e o histórico de movimentações.
4. Define limites mensais por categoria e acompanha o progresso das metas.
5. Analisa despesas por categoria e a evolução dos últimos meses.
6. Exporta os dados das transações ou dos relatórios para uso externo.

## Funcionalidades

### Autenticação e acesso

- Cadastro e login com nome, e-mail e senha.
- Recuperação e redefinição de senha por token com validade limitada.
- Login com Google por OAuth, quando as credenciais da integração estiverem configuradas.
- Sessão identificada por token armazenado no navegador e mantida no servidor durante a execução.
- Isolamento das transações e metas pelo identificador do usuário autenticado.

### Dashboard

- Exibição de saldo, total de receitas e total de despesas.
- Gráfico do saldo acumulado ao longo das movimentações.
- Atalhos para registrar rapidamente uma nova receita ou despesa.
- Indicadores calculados a partir das transações do usuário.

### Transações

- Registro de receitas e despesas.
- Campos para valor, descrição, data, categoria, forma de pagamento e status.
- Formas de pagamento previstas na interface: cartão de crédito, débito, dinheiro e Pix.
- Histórico com filtros por período, categoria e tipo.
- Ordenação por data ou valor, em ordem crescente ou decrescente.
- Exclusão de movimentações pelo próprio usuário.
- Exportação do histórico filtrado para CSV.

### Metas de gastos

- Criação de limite mensal por categoria.
- Atualização de uma meta existente para a mesma categoria.
- Cálculo do progresso a partir das despesas do mês corrente.
- Alertas quando o consumo atinge 80% ou ultrapassa 100% do limite.
- Envio de alerta por e-mail quando o SMTP estiver configurado; sem SMTP, o sistema registra o e-mail simulado no console.

### Relatórios

- Resumo de saldo, receitas e despesas.
- Despesas agrupadas por categoria.
- Evolução mensal dos últimos seis meses.
- Exportação em PDF.
- Exportação do resumo em CSV.

### Perfil e administração

- Questionário para registrar o perfil de investidor do usuário.
- Painel administrativo protegido por função (`admin`).
- Consulta de usuários, quantidade de transações e saldo consolidado da plataforma.
- Visualização, criação, edição e exclusão de transações de usuários pelo administrador.
- Exclusão de usuários comuns e de suas transações pelo painel administrativo.

## Fluxos principais

### Autenticação

A interface React envia as credenciais para a API. O servidor valida os dados no SQLite, cria um token de sessão e devolve o usuário autenticado. Nas requisições seguintes, o token é enviado no cabeçalho `Authorization`. O middleware de autenticação recupera o `user_id` associado e restringe o acesso aos dados daquele usuário.

### Registro de uma transação

O usuário preenche o formulário de receita ou despesa. A API valida a sessão, grava a movimentação na tabela `transactions` vinculada ao `user_id` e responde com o identificador criado. O dashboard e as telas de relatório consultam novamente os dados e recalculam saldo, totais, categorias e evolução mensal.

### Acompanhamento de uma meta

A tela de metas carrega os limites e as despesas do usuário. O sistema agrupa as despesas do mês por categoria, calcula o percentual consumido e apresenta o progresso. Ao salvar uma nova meta, a categoria e o valor limite são persistidos no SQLite. Ao registrar uma despesa, o servidor verifica se o limite alcançou os níveis de aviso e, quando configurado, envia o alerta por e-mail.

## Arquitetura

O sistema segue uma arquitetura cliente-servidor em camadas:

```text
┌─────────────────────────────────────────────────────────────┐
│ Interface web                                                │
│ React 19 + Vite + React Router + Tailwind CSS                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/JSON
┌──────────────────────────────▼──────────────────────────────┐
│ API e servidor de desenvolvimento                            │
│ Node.js + Express + middleware do Vite                       │
│ Autenticação, regras de acesso, transações, metas e relatórios│
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL
┌──────────────────────────────▼──────────────────────────────┐
│ Persistência                                                 │
│ SQLite local com better-sqlite3                              │
└─────────────────────────────────────────────────────────────┘
```

### Camadas e responsabilidades

- **Interface:** páginas React, formulários, navegação, validações de interação, gráficos e notificações.
- **API REST:** rotas Express para autenticação, usuários, transações, metas, estatísticas e administração.
- **Persistência:** banco SQLite criado localmente no arquivo `database.sqlite`.
- **Serviços auxiliares:** Nodemailer para recuperação de senha e alertas de metas; Google OAuth como integração opcional.
- **Visualização:** Recharts para gráficos, `jspdf` e `jspdf-autotable` para relatórios em PDF, além da geração de CSV no navegador.

## Modelo de dados

O banco possui as entidades principais previstas na apresentação do projeto e tabelas de apoio aos fluxos de autenticação e alertas.

| Entidade | Responsabilidade | Relações principais |
| --- | --- | --- |
| `users` | Credenciais, nome, e-mail, função e perfil de investidor. | Um usuário possui transações, metas e tokens de recuperação. |
| `transactions` | Receitas e despesas com valor, tipo, categoria, data e forma de pagamento. | Cada registro pertence a um usuário por `user_id`. |
| `spending_goals` | Limites mensais definidos por categoria. | Cada meta pertence a um usuário; há uma meta por categoria e usuário. |
| `goal_alerts` | Registro dos alertas de 80% e 100% enviados em um mês. | Relacionada ao usuário e à categoria monitorada. |
| `password_resets` | Tokens temporários para redefinição de senha. | Cada token referencia o usuário que solicitou a recuperação. |

O saldo é calculado pela regra `total de receitas - total de despesas`. As estatísticas retornadas pela rota `/api/stats` incluem saldo, totais, despesas por categoria, despesas da competência atual, série acumulada e série mensal dos últimos seis meses.

## Rotas principais da API

Todas as rotas abaixo, exceto as rotas públicas de autenticação, exigem o token enviado em `Authorization: Bearer <token>`.

| Método | Rota | Finalidade |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Criar uma conta. |
| `POST` | `/api/auth/login` | Iniciar uma sessão. |
| `GET` | `/api/auth/me` | Consultar o usuário da sessão atual. |
| `POST` | `/api/auth/logout` | Encerrar a sessão atual. |
| `POST` | `/api/auth/forgot-password` | Solicitar recuperação de senha. |
| `POST` | `/api/auth/reset-password` | Redefinir senha com token válido. |
| `GET` | `/api/auth/google/url` | Obter a URL de autenticação Google. |
| `GET` | `/api/transactions` | Listar as transações do usuário. |
| `POST` | `/api/transactions` | Criar uma transação. |
| `DELETE` | `/api/transactions/:id` | Excluir uma transação do usuário. |
| `GET` | `/api/goals` | Listar metas do usuário. |
| `POST` | `/api/goals` | Criar ou atualizar uma meta por categoria. |
| `DELETE` | `/api/goals/:category` | Excluir uma meta. |
| `GET` | `/api/stats` | Retornar os indicadores financeiros. |
| `POST` | `/api/users/profile` | Salvar o perfil de investidor. |
| `GET` | `/api/admin/stats` | Consultar indicadores administrativos. |
| `GET` | `/api/admin/users/:id/transactions` | Consultar transações de um usuário. |
| `POST` | `/api/admin/users/:id/transactions` | Criar transação para um usuário. |
| `PUT` | `/api/admin/transactions/:txId` | Editar transação como administrador. |
| `DELETE` | `/api/admin/transactions/:txId` | Excluir transação como administrador. |
| `DELETE` | `/api/admin/users/:id` | Excluir usuário comum e suas transações. |

## Tecnologias

### Frontend

- React 19 e React DOM.
- Vite 6 com `tsx` para execução do servidor TypeScript.
- React Router DOM para navegação.
- Tailwind CSS e `@tailwindcss/vite` para estilização responsiva.
- Recharts para visualização de dados.
- Motion para transições e microinterações.
- Lucide React para ícones.
- Sonner para mensagens de sucesso e erro.

### Backend e dados

- Node.js com TypeScript executado por `tsx`.
- Express para a API REST.
- SQLite com `better-sqlite3`.
- Nodemailer para e-mails transacionais opcionais.
- `jspdf` e `jspdf-autotable` para exportação de relatórios em PDF.

## Como executar localmente

### Pré-requisitos

- Node.js 18 ou superior.
- npm.
- Um navegador moderno.

### Instalação

```bash
git clone https://github.com/Guidelminio/Despezzi_03_2026.git
cd Despezzi_03_2026
npm install
```

### Configuração opcional

Para habilitar URLs públicas, recuperação de senha por SMTP, alertas de metas por e-mail ou Google OAuth, copie o arquivo de exemplo e preencha somente as variáveis necessárias:

```bash
cp .env.example .env
```

As variáveis disponíveis estão documentadas em `.env.example`:

- `APP_URL`: endereço usado nos links de recuperação e no callback do OAuth.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM`: configuração de e-mail.
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: credenciais do Google OAuth.

Sem credenciais SMTP, o sistema utiliza um modo simulado e imprime o conteúdo do e-mail no console. Sem credenciais Google, o login social não poderá ser concluído.

### Desenvolvimento

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`. O servidor Express atende a API e incorpora o middleware do Vite para entregar a interface durante o desenvolvimento. O arquivo `database.sqlite` é criado e inicializado automaticamente na primeira execução.

### Verificação e build

```bash
# Verificar tipos TypeScript
npm run lint

# Gerar o build de produção da interface
npm run build

# Servir o build gerado para pré-visualização
npm run preview
```

## Estrutura do projeto

```text
.
├── server.ts                 # Servidor Express e rotas da API
├── src/
│   ├── App.tsx               # Rotas da aplicação React
│   ├── db.ts                 # Inicialização do SQLite e dados de demonstração
│   ├── components/            # Componentes reutilizáveis
│   ├── context/               # Autenticação e tema
│   ├── pages/                 # Telas públicas, financeiras e administrativas
│   └── services/              # Integrações, como envio de e-mails
├── skills/                    # 71 skills de agentes (veja skills/README.md)
├── analytics.py              # Protótipo independente de processamento em Python
├── .env.example              # Modelo de variáveis de ambiente
├── package.json               # Scripts e dependências
└── vite.config.ts             # Configuração do Vite
```

## Alinhamento entre a apresentação e a implementação

A apresentação visual do projeto descreve o Despezi com quatro ideias centrais: **rastreabilidade das movimentações**, **indicadores para leitura financeira**, **metas conectadas ao comportamento de gastos** e **acesso protegido por perfil**. Este README mantém essa organização e documenta os fluxos de autenticação, registro de transação e acompanhamento de metas apresentados no material.

Há, entretanto, diferenças importantes entre a arquitetura conceitual apresentada e o código atual:

- A apresentação menciona JWT, mas o servidor atual utiliza tokens UUID mantidos em memória no objeto `sessions`. As sessões são perdidas quando o processo é reiniciado.
- As senhas ainda são comparadas e armazenadas diretamente no SQLite. O uso de hash criptográfico deve ser implementado antes de qualquer uso real.
- O arquivo `analytics.py` contém um protótipo independente de processamento. O fluxo usado atualmente pelo endpoint `/api/stats` calcula as estatísticas diretamente no servidor Node.js.
- O processamento atual persiste as entidades `users`, `transactions`, `spending_goals`, `goal_alerts` e `password_resets`. Não existe, no esquema inicial atual, a tabela `analytics_results` descrita em uma documentação anterior.
- O OAuth Google e os e-mails dependem de variáveis de ambiente e de configuração externa. Eles são integrações opcionais, não requisitos para executar o núcleo local do sistema.

Essas diferenças são registradas para que a documentação represente tanto a visão do produto quanto o estado verificável do repositório.

## Próximos passos técnicos

Para aproximar o protótipo de um ambiente de produção, os próximos trabalhos recomendados são a substituição das sessões em memória por uma estratégia persistente e segura, a aplicação de hash e política de expiração para senhas, a validação consistente dos dados recebidos pela API, a remoção ou parametrização das credenciais e seeds de demonstração, a inclusão de testes automatizados e a definição de um processo explícito para o `analytics.py` caso o processamento Python continue fazendo parte da arquitetura.

## Licença

O projeto contém a indicação de licença Apache-2.0 no código-fonte da aplicação. Consulte os arquivos do repositório para a definição completa dos termos aplicáveis.
