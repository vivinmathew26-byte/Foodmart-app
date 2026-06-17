from flask import Flask, request, jsonify, send_file, send_from_directory, session, redirect
import sqlite3, json, os
from datetime import datetime

# ─────────────────────────────────────
#  App setup - static_folder points to /app
# ─────────────────────────────────────
app = Flask(__name__, static_folder='/app', static_url_path='')
app.secret_key = "food_secret_key"
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
DB = "/app/orders.db"

# ─────────────────────────────────────
#  Database setup
# ─────────────────────────────────────
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

# ─────────────────────────────────────
#  Serve static files
# ─────────────────────────────────────
@app.route('/style.css')
def serve_css():
    return send_from_directory('/app', 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('/app', 'script.js')

# ─────────────────────────────────────
#  Serve HTML pages
# ─────────────────────────────────────
@app.route('/')
def index():
    return send_file('/app/Index.html')

@app.route('/order')
def order_page():
    return send_file('/app/order.html')

# ─────────────────────────────────────
#  API - Place order
# ─────────────────────────────────────
@app.route('/api/order', methods=['POST'])
def place_order():
    data = request.get_json()
    conn = sqlite3.connect(DB)
    cursor = conn.execute('''INSERT INTO orders
        (name, table_num, items, subtotal, sgst, cgst, total, created)
        VALUES (?,?,?,?,?,?,?,?)''', (
        data['customer_name'],
        data['table_number'],
        json.dumps(data['items']),
        data['subtotal'],
        data['sgst'],
        data['cgst'],
        data['total'],
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({
        "success": True,
        "message": "Order placed!",
        "order_id": order_id,
        "items": data['items']
    })

# ─────────────────────────────────────
#  Admin login
# ─────────────────────────────────────
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password') == ADMIN_PASSWORD:
            session['admin'] = True
            return redirect('/admin')
    return '''
    <html><body style="font-family:Arial;display:flex;justify-content:center;margin-top:100px">
    <div style="border:1px solid #ddd;padding:30px;border-radius:8px;text-align:center">
        <h2>🍔 Admin Login</h2>
        <form method="POST">
            <input type="password" name="password" placeholder="Enter password"
                style="padding:8px;margin:10px 0;width:200px;display:block;margin:10px auto">
            <button type="submit"
                style="background:#ff6347;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer">
                Login
            </button>
        </form>
    </div>
    </body></html>
    '''

# ─────────────────────────────────────
#  Admin panel
# ─────────────────────────────────────
@app.route('/admin')
def admin():
    if not session.get('admin'):
        return redirect('/admin/login')
    conn = sqlite3.connect(DB)
    orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
    conn.close()

    rows = ""
    for o in orders:
        items = json.loads(o[3])
        item_list = ", ".join([f"{i['name']} x{i['qty']}" for i in items])
        rows += f"<tr><td>{o[0]}</td><td>{o[1]}</td><td>{o[2]}</td>"
        rows += f"<td>{item_list}</td><td>₹{o[7]}</td>"
        rows += f"<td>{o[8]}</td><td>{o[9]}</td>"
        rows += f"<td><button onclick=\"del({o[0]})\" style='background:red;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer'>🗑 Delete</button></td></tr>"

    return f'''
    <html><head>
    <style>
        body {{ font-family: Arial; padding: 20px; background: #f4f4f4; }}
        h1 {{ color: #ff6347; }}
        table {{ width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
        th {{ background: #ff6347; color: white; padding: 12px; text-align: left; }}
        td {{ padding: 10px 12px; border-bottom: 1px solid #eee; }}
        tr:hover td {{ background: #fff5f3; }}
        .stats {{ display:flex; gap:20px; margin-bottom:20px; }}
        .stat-card {{ background:white; padding:15px 20px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1); }}
        .stat-num {{ font-size:24px; font-weight:bold; color:#ff6347; }}
    </style>
    </head><body>
    <h1>🍔 My Delicious Bites — Admin Panel</h1>
    <div class="stats">
        <div class="stat-card">
            <div class="stat-num">{len(orders)}</div>
            <div>Total Orders</div>
        </div>
        <div class="stat-card">
            <div class="stat-num">₹{sum(o[7] for o in orders):.0f}</div>
            <div>Total Revenue</div>
        </div>
    </div>
    <table>
        <tr>
            <th>ID</th><th>Name</th><th>Table</th>
            <th>Items</th><th>Total</th><th>Status</th>
            <th>Time</th><th>Action</th>
        </tr>
        {rows if rows else "<tr><td colspan='8' style='text-align:center;padding:20px;color:#999'>No orders yet</td></tr>"}
    </table>
    <script>
    function del(id) {{
        if(confirm('Delete this order?')) {{
            fetch('/api/order/' + id, {{ method: 'DELETE' }})
            .then(() => location.reload());
        }}
    }}
    </script>
    </body></html>
    '''

# ─────────────────────────────────────
#  API - Delete order
# ─────────────────────────────────────
@app.route('/api/order/<int:id>', methods=['DELETE'])
def delete_order(id):
    conn = sqlite3.connect(DB)
    conn.execute('DELETE FROM orders WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ─────────────────────────────────────
#  Start server
# ─────────────────────────────────────
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
