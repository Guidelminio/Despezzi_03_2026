# 📊 Despezi - Sistema de Gestão Financeira Inteligente

**Projeto de Trabalho de Conclusão de Curso (TCC)**
**Curso:** Técnico em Informática Integrado
**Desenvolvedores:** [Seu Nome] e Lincoln

---

## 💡 Sobre o Projeto
O **Despezi** é um sistema web de gestão financeira pessoal criado para ajudar os usuários a controlarem suas receitas e despesas de forma inteligente. 

O sistema conta com um assistente virtual integrado (Pezzy IA) que utiliza inteligência artificial generativa para fornecer conselhos financeiros personalizados com base no histórico de transações e no perfil de investidor do usuário.

---

## 📖 Documentação do Sistema

### ✅ Requisitos Funcionais (RF)
*O que o sistema deve fazer.*

* **RF01 - Cadastro de Usuários:** O sistema deve permitir que novos usuários se cadastrem informando nome, e-mail e senha (com validação de força de senha).
* **RF02 - Autenticação:** O sistema deve permitir o login de usuários utilizando e-mail e senha, ou conta Google (OAuth).
* **RF03 - Gestão de Transações:** O sistema deve permitir a inserção, edição e exclusão de receitas e despesas, categorizando-as.
* **RF04 - Painel de Resumo (Dashboard):** O sistema deve exibir um painel com saldo atual, total de receitas e despesas do mês atual.
* **RF05 - Relatórios Visuais:** O sistema deve gerar gráficos (pizza e barras) para análise de gastos por categoria e evolução mensal.
* **RF06 - Gestão de Metas:** O sistema deve permitir a criação de metas financeiras (limites de gastos por categoria) e o acompanhamento do progresso.
* **RF07 - Assistente Virtual (Pezzy IA):** O sistema deve integrar uma IA generativa para responder dúvidas financeiras com base no histórico real do usuário.
* **RF08 - Perfil de Investidor:** O sistema deve fornecer um questionário para definir o perfil de risco do usuário (Conservador, Moderado, Arrojado).
* **RF09 - Painel Administrativo:** O sistema deve possuir uma área restrita para administradores gerenciarem usuários e visualizarem suas transações para suporte.

### ⚡ Requisitos Não Funcionais (RN)
*Como o sistema deve ser (qualidade, performance, segurança).*

* **RN01 - Responsividade:** A interface deve se adaptar perfeitamente a dispositivos móveis, tablets e desktops (Mobile First).
* **RN02 - Segurança de Dados:** As senhas devem ser validadas no frontend e backend. As rotas da API devem ser protegidas por tokens de autenticação.
* **RN03 - Desempenho da IA:** O tempo de resposta do assistente Pezzy IA não deve exceder 5 segundos em condições normais de rede.
* **RN04 - Acessibilidade e Usabilidade:** O sistema deve suportar alternância entre Tema Claro e Tema Escuro, salvando a preferência do usuário.
* **RN05 - Stack Tecnológica:** O frontend deve ser desenvolvido em React (Vite) com Tailwind CSS, e o backend em Node.js (Express) com banco de dados SQLite.

### 👥 Casos de Uso Principais (UC)

* **UC01 - Registrar Nova Transação:** 
  * **Ator:** Usuário
  * **Fluxo:** O usuário acessa a tela de Nova Transação > Preenche valor, tipo, categoria e data > Salva a transação > O sistema atualiza o saldo geral e os gráficos do painel.
* **UC02 - Consultar Assistente Financeiro:** 
  * **Ator:** Usuário
  * **Fluxo:** O usuário acessa a tela do Pezzy IA > Envia uma pergunta sobre suas finanças > O sistema compila o saldo, últimas transações e perfil de investidor, enviando como contexto para a IA > A IA retorna um conselho personalizado.
* **UC03 - Gerenciar Usuários:** 
  * **Ator:** Administrador
  * **Fluxo:** O admin acessa o Painel Administrativo > Visualiza a lista de usuários cadastrados > Pode visualizar, editar ou excluir transações de qualquer usuário para suporte técnico.

### 🛡️ Regras de Negócio (RNeg)

* **RNeg01 - Cálculo de Saldo:** O saldo atual não é um campo fixo no banco de dados. Ele é calculado dinamicamente subtraindo a soma de todas as despesas da soma de todas as receitas do usuário.
* **RNeg02 - Privacidade e Isolamento:** Um usuário comum só pode visualizar, editar e excluir as transações e metas criadas por ele mesmo. O backend deve sempre validar a propriedade dos dados.
* **RNeg03 - Contexto Restrito da IA:** A inteligência artificial só terá acesso aos dados financeiros do usuário que está fazendo a requisição. Dados de outros usuários jamais podem ser enviados no prompt da IA.
* **RNeg04 - Validação de Senha:** Para criar uma conta, a senha deve ter obrigatoriamente no mínimo 8 caracteres, contendo pelo menos uma letra e um número.

---

## 🚀 Tecnologias Utilizadas

* **Frontend:** React.js, Tailwind CSS, Lucide Icons, Recharts (para gráficos), Framer Motion (animações).
* **Backend:** Node.js, Express.
* **Banco de Dados:** SQLite (escolhido pela leveza e facilidade de integração local).
* **Inteligência Artificial:** Google Gemini API (via `@google/genai`).

---

## ⚙️ Como rodar o projeto localmente

### 1. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes chaves (veja o `.env.example`):
```env
GEMINI_API_KEY="sua_chave_aqui"
```

### 2. Iniciando o Servidor (Frontend + Backend)
Abra o terminal na pasta do projeto e execute:
```bash
# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento (Vite + Express)
npm run dev
```
O site estará disponível em `http://localhost:3000`.

---

## 🔮 Próximos Passos (Evolução do TCC)
- [ ] Implementar criptografia de senhas (Hashing com bcrypt).
- [ ] Implementar recuperação de senha por e-mail (SMTP).
- [ ] Exportação de relatórios em PDF/Excel.
