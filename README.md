# 📊 Despezi - Sistema de Gestão Financeira Inteligente

**Projeto de Trabalho de Conclusão de Curso (TCC)**
**Curso:** Técnico em Informática Integrado
**Desenvolvedores:** [Seu Nome] e Lincoln

---

## 💡 Sobre o Projeto
O **Despezi** é um sistema web de gestão financeira pessoal criado para ajudar os usuários a controlarem suas receitas e despesas de forma inteligente. 

Nosso principal diferencial neste TCC foi a escolha da arquitetura. Em vez de fazermos um sistema monolítico tradicional, decidimos separar as responsabilidades:
1. **O Corpo (Node.js + React):** Cuida de toda a interface, interação com o usuário, segurança (autenticação JWT) e persistência básica de dados (CRUD).
2. **O Cérebro (Python):** Como nossa especialidade é a lógica matemática e o Python, isolamos todo o processamento de dados, geração de estatísticas e inteligência financeira em um script Python externo. 

Essa abordagem é conhecida no mercado como **Processamento Assíncrono em Lote (Batch Processing)** e garante que o site não fique lento enquanto cálculos complexos são realizados.

---

## 🚀 Tecnologias Utilizadas

* **Frontend:** React.js, Tailwind CSS, Lucide Icons, Recharts (para gráficos).
* **Backend:** Node.js, Express.
* **Banco de Dados:** SQLite (escolhido pela leveza e facilidade de integração local).
* **Processamento de Dados (Data Science):** Python (Script independente para cálculos matemáticos).

---

## ⚙️ Como rodar o projeto localmente

Para que o sistema funcione perfeitamente, é necessário rodar tanto o servidor web quanto o nosso motor de processamento em Python.

### 1. Iniciando o Servidor Web (Node.js/React)
Abra o terminal na pasta do projeto e execute:
```bash
# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```
O site estará disponível em `http://localhost:3000`.

### 2. Rodando o Motor de Analytics (Python)
Para que os gráficos e saldos sejam calculados, abra um novo terminal e execute o nosso script:
```bash
python analytics.py
```
*Nota: O script Python vai ler o banco de dados `database.sqlite`, fazer toda a matemática e salvar os resultados prontos para o Node.js exibir na tela.*

---

## 🔮 Próximos Passos (Evolução do TCC)
- [ ] Implementar criptografia de senhas (Hashing com bcrypt).
- [ ] Normalizar a tabela de categorias (1FN/2FN).
- [ ] Criar sistema de Metas/Orçamentos (Budgets) processado pelo Python.
- [ ] Implementar predição de gastos usando bibliotecas de IA no Python.
