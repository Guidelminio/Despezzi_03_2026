# 📊 Despezi - Sistema de Gestão Financeira Inteligente

**Projeto de Trabalho de Conclusão de Curso (TCC)**
**Curso:** Técnico em Informática Integrado
**Desenvolvedores:** [Seu Nome] e Lincoln

---

## 🎯 1. Escopo do Projeto e Visão Geral

O **Despezi** é uma plataforma web completa de Gestão Financeira Pessoal (PFM - Personal Finance Management). O objetivo principal do sistema é democratizar o controle financeiro e a educação financeira através de uma interface intuitiva e do uso de Inteligência Artificial.

**O que o sistema FAZ (Dentro do Escopo):**
* Controle manual de entradas (receitas) e saídas (despesas).
* Categorização de gastos para análise detalhada.
* Definição e acompanhamento de metas financeiras.
* Análise de perfil de investidor através de questionário.
* Aconselhamento financeiro personalizado via IA (Pezzy IA) com base nos dados reais do usuário.
* Gestão administrativa de usuários.

**O que o sistema NÃO FAZ (Fora do Escopo Atual):**
* Integração automática com APIs de bancos (Open Finance).
* Realização de transações financeiras reais (pagamentos, transferências).
* Recomendação direta de compra/venda de ativos específicos da bolsa de valores (apenas aconselhamento educacional).

---

## 🏗️ 2. Arquitetura do Sistema

O projeto foi desenvolvido utilizando a arquitetura **Client-Server (Cliente-Servidor)**, separando claramente as responsabilidades:

* **Frontend (Client):** Uma *Single Page Application* (SPA) construída com React.js. Responsável por toda a interface, roteamento no lado do cliente, validações de formulário e experiência do usuário (UX/UI).
* **Backend (Server):** Uma API RESTful construída com Node.js e Express. Responsável por processar as regras de negócio, autenticação, comunicação com a API do Google Gemini e persistência de dados.
* **Banco de Dados:** SQLite, operando de forma embutida no backend, garantindo leveza e facilidade de implantação.

---

## 🧩 3. Módulos e Funcionalidades Detalhadas

### 3.1. Módulo de Autenticação e Segurança
* **Login/Cadastro Tradicional:** Autenticação via e-mail e senha com validação de complexidade.
* **Login Social (OAuth):** Integração com Google para login em um clique.
* **Sessões:** Gerenciamento de sessões seguras utilizando tokens JWT (JSON Web Tokens).

### 3.2. Módulo de Gestão Financeira
* **Dashboard:** Visão panorâmica contendo Saldo Atual, Receitas do Mês, Despesas do Mês e um gráfico de balanço.
* **Transações:** CRUD (Create, Read, Update, Delete) completo de movimentações. Inclui filtros por data, tipo e categoria.
* **Metas (Goals):** Criação de objetivos financeiros (ex: "Viagem", "Reserva de Emergência") com valor alvo e acompanhamento visual do progresso.

### 3.3. Módulo de Análise e Relatórios
* **Gráficos de Categoria:** Gráfico de pizza mostrando a distribuição dos gastos.
* **Evolução Mensal:** Gráfico de barras comparando receitas e despesas ao longo dos meses.

### 3.4. Módulo de Inteligência Artificial (Pezzy IA)
* **Chatbot Contextual:** Um assistente que recebe no *prompt* (de forma invisível ao usuário) o saldo atual, as últimas transações e o perfil de investidor.
* **Perfil de Investidor:** Um quiz interativo que classifica o usuário como Conservador, Moderado ou Arrojado, moldando as respostas da IA.

### 3.5. Módulo Administrativo
* **Painel Admin:** Área restrita para usuários com a *role* `admin`.
* **Auditoria:** Capacidade de listar todos os usuários, visualizar suas métricas e acessar suas transações para fins de suporte técnico.

---

## 📖 4. Documentação de Requisitos

### ✅ Requisitos Funcionais (RF)
* **RF01 - Gestão de Usuários:** O sistema deve permitir cadastro, login e edição de perfil de usuários.
* **RF02 - Autenticação OAuth:** O sistema deve permitir login utilizando a conta do Google.
* **RF03 - Gestão de Transações:** O sistema deve permitir criar, ler, atualizar e deletar (CRUD) transações financeiras.
* **RF04 - Categorização:** O sistema deve obrigar a vinculação de toda transação a uma categoria predefinida.
* **RF05 - Dashboard:** O sistema deve calcular e exibir o saldo atual e o balanço mensal em tempo real.
* **RF06 - Relatórios:** O sistema deve gerar gráficos interativos de despesas por categoria e evolução temporal.
* **RF07 - Gestão de Metas:** O sistema deve permitir a criação de metas com valor alvo e valor atual, exibindo uma barra de progresso.
* **RF08 - Perfil de Investidor:** O sistema deve aplicar um questionário e salvar o perfil de risco do usuário.
* **RF09 - Assistente IA:** O sistema deve possuir um chat integrado com a API do Google Gemini, capaz de ler o contexto financeiro do usuário.
* **RF10 - Painel Admin:** O sistema deve possuir uma rota protegida exclusiva para administradores gerenciarem a base de usuários.

### ⚡ Requisitos Não Funcionais (RN)
* **RN01 - Responsividade:** A interface deve ser *Mobile First*, adaptando-se a telas de celulares, tablets e desktops.
* **RN02 - Performance:** O carregamento inicial da aplicação (SPA) deve ocorrer em menos de 3 segundos.
* **RN03 - Segurança:** As senhas devem ser armazenadas com hash criptográfico. A API deve validar tokens JWT em todas as rotas privadas.
* **RN04 - Usabilidade (Temas):** O sistema deve suportar *Dark Mode* e *Light Mode*, respeitando a preferência do sistema operacional do usuário.
* **RN05 - Disponibilidade da IA:** O tempo de resposta do assistente Pezzy IA deve ser otimizado, com tratamento de erros caso a API do Google esteja indisponível.

### 🛡️ Regras de Negócio (RNeg)
* **RNeg01 - Cálculo de Saldo:** O saldo não é armazenado estaticamente. Ele é o resultado da equação: `Σ Receitas - Σ Despesas`.
* **RNeg02 - Isolamento de Dados (Multitenancy):** Um usuário (role `user`) só tem permissão para acessar registros onde a chave estrangeira `user_id` corresponda ao seu próprio ID.
* **RNeg03 - Privacidade da IA:** O contexto enviado para a IA deve ser estritamente limitado aos dados do usuário logado. É proibido o vazamento de dados cruzados no prompt.
* **RNeg04 - Validação de Senha:** Senhas novas devem ter no mínimo 8 caracteres, contendo letras e números.
* **RNeg05 - Hierarquia de Acesso:** Apenas usuários com a coluna `role` definida como `admin` podem acessar as rotas `/admin/*`.

---

## 👥 5. Casos de Uso Principais (UC)

| ID | Nome do Caso de Uso | Ator Principal | Resumo do Fluxo |
|---|---|---|---|
| **UC01** | Registrar Transação | Usuário | Acessa formulário > Preenche dados (valor, data, categoria) > Salva > Sistema atualiza saldo. |
| **UC02** | Consultar IA | Usuário | Acessa Pezzy IA > Digita dúvida > Sistema anexa histórico financeiro > Envia à API Gemini > Exibe resposta. |
| **UC03** | Definir Perfil | Usuário | Acessa Perfil > Responde Quiz > Sistema calcula pontuação > Salva perfil (Conservador/Moderado/Arrojado). |
| **UC04** | Acompanhar Meta | Usuário | Acessa Metas > Visualiza barra de progresso > Adiciona valor à meta > Sistema atualiza porcentagem concluída. |
| **UC05** | Auditar Contas | Admin | Acessa Painel Admin > Lista usuários > Seleciona usuário > Visualiza transações para suporte. |

---

## 🗄️ 6. Modelagem de Dados (Banco de Dados)

O sistema utiliza um banco de dados relacional (SQLite) com as seguintes entidades principais:

1. **Users (Usuários):** Armazena credenciais, dados pessoais, `role` (admin/user) e o `investor_profile`.
2. **Transactions (Transações):** Armazena as movimentações. Possui chave estrangeira `user_id`, valor, tipo (income/expense), categoria, data e descrição.
3. **Goals (Metas):** Armazena os objetivos financeiros. Possui chave estrangeira `user_id`, título, valor alvo, valor atual e data limite.

---

## 🚀 7. Tecnologias Utilizadas

### Frontend
* **React.js (via Vite):** Biblioteca principal para construção da interface.
* **Tailwind CSS:** Framework de CSS utilitário para estilização rápida e responsiva.
* **Framer Motion:** Biblioteca para animações fluidas e transições de página.
* **Recharts:** Biblioteca para renderização de gráficos SVG (Pizza e Barras).
* **React Router DOM:** Gerenciamento de rotas no lado do cliente.
* **Lucide React:** Pacote de ícones consistentes e modernos.
* **Sonner:** Biblioteca para notificações (Toasts) elegantes.

### Backend & IA
* **Node.js & Express:** Ambiente de execução e framework para a API REST.
* **SQLite:** Banco de dados relacional leve.
* **Google GenAI SDK (`@google/genai`):** Integração oficial com o modelo Gemini 3 Flash para o assistente virtual.
* **JWT (JSON Web Token):** Padrão da indústria para autenticação *stateless*.

---

## ⚙️ 8. Guia de Instalação e Execução

### Pré-requisitos
* Node.js instalado (versão 18+ recomendada).
* Chave de API do Google Gemini Studio.

### Passo a Passo

1. **Clone o repositório e instale as dependências:**
```bash
npm install
```

2. **Configuração de Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz do projeto e insira sua chave da API do Gemini:
```env
GEMINI_API_KEY="sua_chave_do_google_ai_studio_aqui"
```

3. **Iniciando o Servidor (Frontend + Backend integrados):**
```bash
npm run dev
```
*O sistema estará disponível no seu navegador em `http://localhost:3000`.*

---

## 🔮 9. Próximos Passos (Trabalhos Futuros)
* Implementação de criptografia forte (Bcrypt) para as senhas no banco de dados.
* Recuperação de senha via envio de e-mail (SMTP/Nodemailer).
* Exportação de relatórios financeiros em formato PDF e planilhas Excel (CSV).
* Implementação de transações recorrentes (assinaturas mensais automáticas).
