from flask import Flask, request, jsonify, send_file, send_from_directory, session, redirect
import sqlite3, json, os
from datetime import datetime

app = Flask(__name__, static_folder='.', static_url_path='')

# Serve static files (css, js)
@app.route('/style.css')
def serve_css():
    return send_from_directory('.', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('.', 'script.js')

# Serve main page
@app.route('/')
def index():
    return send_file('Index.html')

@app.route('/order')
def order_page():
    return send_file('order.html')

app = Flask(__name__)
app.secret_key = "food_secret_key"
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
DB = "orders.db"

# Create database on startup
def init_db():
    conn = sqlite3.connect(DB)
    conn.execute('''CREATE TABLE IF NOT EXISTS orders (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        name      TEXT,
        table_num TEXT,
        items     TEXT,
        subtotal  REAL,
        sgst      REAL,
        cgst      REAL,
        total     REAL,
        status    TEXT DEFAULT 'Pending',
        created   TEXT
    )''')
    conn.commit()
    conn.close()

# Serve frontend pages
@app.route('/')
def index():
    return send_file('Index.html')

@app.route('/order')
def order_page():
    return send_file('order.html')

# Receive order from frontend
@app.route('/api/order', methods=['POST'])
def place_order():
    data = request.get_json()
    conn = sqlite3.connect(DB)
    conn.execute('''INSERT INTO orders
        (name, table_num, items, subtotal, sgst, cgst, total, created)
        VALUES (?,?,?,?,?,?,?,?)''', (
        data['customer_name'], data['table_number'],
        json.dumps(data['items']),
        data['subtotal'], data['sgst'],
        data['cgst'], data['total'],
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Order placed!"})

# Admin login
@app.route('/admin/login', methods=['GET','POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password') == ADMIN_PASSWORD:
            session['admin'] = True
            return redirect('/admin')
    return '''<form method="POST">
        <h2>Admin Login</h2>
        <input type="password" name="password" placeholder="Password">
        <button type="submit">Login</button>
    </form>'''

# Admin panel
@app.route('/admin')
def admin():
    if not session.get('admin'):
        return redirect('/admin/login')
    conn = sqlite3.connect(DB)
    orders = conn.execute(
        'SELECT * FROM orders ORDER BY id DESC').fetchall()
    conn.close()
    # Build admin HTML table
    rows = ""
    for o in orders:
        items = json.loads(o[3])
        item_list = ", ".join([f"{i['name']} x{i['qty']}" for i in items])
        rows += f"<tr><td>{o[0]}</td><td>{o[1]}</td><td>{o[2]}</td>"
        rows += f"<td>{item_list}</td><td>₹{o[7]}</td>"
        rows += f"<td>{o[8]}</td><td>{o[9]}</td>"
        rows += f"<td><button onclick=\"del({o[0]})\">🗑 Delete</button></td></tr>"
    return f'''<html><body>
        <h1>🍔 Admin Panel</h1>
        <table border="1">
        <tr><th>ID</th><th>Name</th><th>Table</th>
        <th>Items</th><th>Total</th><th>Status</th>
        <th>Time</th><th>Action</th></tr>
        {rows}
        </table>
        <script>
        function del(id){{
            fetch('/api/order/'+id,{{method:'DELETE'}})
            .then(()=>location.reload());
        }}
        </script>
        </body></html>'''

# Delete order
@app.route('/api/order/<int:id>', methods=['DELETE'])
def delete_order(id):
    conn = sqlite3.connect(DB)
    conn.execute('DELETE FROM orders WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
