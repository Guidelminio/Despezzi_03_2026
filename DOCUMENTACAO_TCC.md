#  Documentação de Engenharia de Software - Despezi

Este documento foi elaborado por mim e pelo Lincoln para detalhar a arquitetura, a modelagem de dados e os requisitos do nosso TCC. Ele serve como base para a escrita da nossa monografia/relatório final.

---

## 1. Arquitetura do Sistema ( Fluxo de Dados)

Decidimos utilizar uma arquitetura híbrida para demonstrar nosso domínio em diferentes tecnologias e otimizar o processamento matemático. O fluxo da informação funciona em 5 etapas:

1. **Entrada (Frontend - React):** O usuário insere um novo gasto na interface.
2. **Transporte (API - Node.js):** O React envia os dados via requisição POST para o backend.
3. **Persistência Bruta (SQLite):** O Node.js salva a transação na tabela `transactions`. O dado fica armazenado de forma bruta.
4. **Processamento Matemático (Python):** Nosso script `analytics.py` entra em ação. Ele lê as transações brutas, realiza somas, médias, agrupamentos por mês e cálculos de saldo. Após processar, ele salva um JSON consolidado na tabela `analytics_results`.
5. **Exibição (Dashboard):** Quando o usuário acessa a tela inicial, o Node.js apenas consulta a tabela `analytics_results` (que já foi mastigada pelo Python) e devolve para o React montar os gráficos.

---

## 2. Modelagem do Banco de Dados (MER Lógico)

Utilizamos o SQLite. A estrutura atual conta com 3 tabelas principais:

### Tabela: `users` (Usuários)
Responsável pelo controle de acesso.
* `id` (INTEGER): Chave Primária (PK), Auto-incremento.
* `name` (TEXT): Nome do usuário.
* `email` (TEXT): E-mail (Único).
* `password` (TEXT): Senha de acesso.
* `role` (TEXT): Nível de acesso ('user' ou 'admin').

### Tabela: `transactions` (Transações)
Armazena os dados brutos de movimentação financeira.
* `id` (INTEGER): Chave Primária (PK), Auto-incremento.
* `user_id` (INTEGER): Chave Estrangeira (FK) -> `users(id)`.
* `type` (TEXT): 'income' (receita) ou 'expense' (despesa).
* `amount` (REAL): Valor da transação.
* `description` (TEXT): Título do gasto/ganho.
* `date` (TEXT): Data (AAAA-MM-DD).
* `category` (TEXT): Categoria da transação.
* `payment_method` (TEXT): Forma de pagamento.
* `status` (TEXT): Status atual.

### Tabela: `analytics_results` (Resultados do Python)
A ponte de comunicação entre o nosso script Python e o servidor Node.js.
* `user_id` (INTEGER): Chave Primária (PK) e Estrangeira (FK) -> `users(id)`.
* `data` (TEXT): Objeto JSON com os cálculos prontos (saldos, totais, dados do gráfico).
* `updated_at` (DATETIME): Timestamp do último processamento.

---

## 3. Requisitos do Sistema

### Requisitos Funcionais (RF)
* **RF01:** O sistema deve permitir o cadastro e login de usuários.
* **RF02:** O sistema deve registrar receitas e despesas vinculadas ao usuário logado.
* **RF03:** O sistema deve listar o histórico financeiro do usuário.
* **RF04:** O sistema deve possuir um motor externo (Python) para calcular estatísticas financeiras.
* **RF05:** O sistema deve exibir um Dashboard visual com os dados processados pelo motor externo.

### Requisitos Não Funcionais (RNF)
* **RNF01:** O sistema deve ser desenvolvido usando React (Front), Node.js (Back) e Python (Data Processing).
* **RNF02:** O banco de dados deve ser relacional (SQLite).
* **RNF03:** A comunicação entre Front e Back deve ser feita via API REST protegida por JWT.
* **RNF04:** O processamento matemático não deve bloquear a Thread principal do servidor web (Node.js).

---

## 4. Casos de Uso Principais

* **UC01 - Lançar Movimentação:** O usuário preenche o formulário de nova despesa/receita e o sistema salva no banco.
* **UC02 - Processar Analytics:** O script Python varre o banco de dados, executa a lógica matemática desenvolvida por nós e atualiza a tabela de resultados.
* **UC03 - Visualizar Resumo:** O usuário abre o Dashboard e visualiza os gráficos gerados a partir dos dados processados pelo Python.
