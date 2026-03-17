import sqlite3
import json
from datetime import datetime

def process_analytics():
    # 1. Conectar ao banco de dados SQLite
    # O arquivo deve estar na mesma pasta ou no caminho correto
    conn = sqlite3.connect('database.sqlite')
    cursor = conn.cursor()

    print(f"[{datetime.now()}] Iniciando processamento de analytics...")

    try:
        # 2. Buscar todos os usuários
        cursor.execute("SELECT id FROM users")
        users = cursor.fetchall()

        for user in users:
            user_id = user[0]
            
            # 3. Buscar transações do usuário
            cursor.execute("SELECT type, amount, category, date FROM transactions WHERE user_id = ?", (user_id,))
            transactions = cursor.fetchall()

            # --- PARTE MATEMÁTICA (Onde você e o Lincoln entram) ---
            total_income = 0
            total_expense = 0
            category_expenses = {}
            
            # Exemplo de lógica simples de soma
            for t_type, amount, category, date in transactions:
                if t_type == 'income':
                    total_income += amount
                else:
                    total_expense += amount
                    category_expenses[category] = category_expenses.get(category, 0) + amount

            # Cálculo do saldo
            balance = total_income - total_expense

            # Exemplo de geração de dados para o gráfico (últimos 6 meses)
            # Aqui vocês podem usar Pandas ou lógica pura de Python
            chart_data = [
                {"name": "Jan", "value": 100, "income": 200, "expense": 100},
                {"name": "Fev", "value": 150, "income": 250, "expense": 100},
                # ... adicione a lógica real aqui
            ]

            # 4. Preparar o objeto final
            results = {
                "balance": balance,
                "totalIncome": total_income,
                "totalExpense": total_expense,
                "categoryExpenses": category_expenses,
                "chartData": chart_data
            }

            # 5. Salvar na tabela analytics_results
            # Usamos INSERT OR REPLACE para atualizar se já existir
            cursor.execute("""
                INSERT OR REPLACE INTO analytics_results (user_id, data, updated_at)
                VALUES (?, ?, ?)
            """, (user_id, json.dumps(results), datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

        conn.commit()
        print(f"[{datetime.now()}] Analytics processado com sucesso para {len(users)} usuários.")

    except Exception as e:
        print(f"Erro ao processar analytics: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    process_analytics()
