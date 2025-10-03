const express = require('express');
const mysql = require('mysql2'); // Cambio de sqlite3 a mysql2
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Configuración y Conexión a MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'inventory_db'
};

const pool = mysql.createPool(dbConfig); // Se reemplaza la conexión de sqlite3 por un pool de MySQL

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize MySQL database - Se mantiene la estructura serializada de inicialización
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a MySQL: ' + err.stack);
        return;
    }

    // Create tables
    connection.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creando tabla de productos:', err.message);
            connection.release();
            return;
        }

        // Insert sample data
        connection.query('SELECT COUNT(*) AS count FROM products', (err, results) => {
            if (err) {
                console.error('Error al contar productos:', err.message);
                connection.release();
                return;
            }

            if (results[0].count === 0) {
                const sampleProducts = [
                    ['Laptop Pro', 'Electronics', 15, 1299.99, 'High-performance laptop'],
                    ['Wireless Mouse', 'Electronics', 45, 29.99, 'Ergonomic wireless mouse'],
                    ['Office Chair', 'Furniture', 8, 199.99, 'Comfortable office chair'],
                    ['Coffee Beans', 'Food', 120, 12.99, 'Premium coffee beans'],
                    ['Notebook Set', 'Office Supplies', 200, 8.99, 'Pack of 3 notebooks']
                ];

                const insertQuery = 'INSERT INTO products (name, category, quantity, price, description) VALUES ?';
                const values = sampleProducts.map(p => p);

                connection.query(insertQuery, [values], (err) => {
                    if (err) {
                        console.error('Error insertando datos de muestra:', err.message);
                    }
                    connection.release();
                });
            } else {
                connection.release();
            }
        });
    });
});

// API Routes
app.get('/api/products', (req, res) => {
    pool.query('SELECT * FROM products ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    pool.query('SELECT * FROM products WHERE id = ?', [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (rows.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(rows[0]);
    });
});

app.post('/api/products', (req, res) => {
    const { name, category, quantity, price, description } = req.body;
    
    if (!name || !category || quantity === undefined || price === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    pool.query(
        'INSERT INTO products (name, category, quantity, price, description) VALUES (?, ?, ?, ?, ?)',
        [name, category, quantity, price, description],
        function(err, result) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: result.insertId, message: 'Product created successfully' });
        }
    );
});

app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, price, description } = req.body;
    
    pool.query(
        'UPDATE products SET name = ?, category = ?, quantity = ?, price = ?, description = ? WHERE id = ?',
        [name, category, quantity, price, description, id],
        function(err, result) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            res.json({ message: 'Product updated successfully' });
        }
    );
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    
    pool.query('DELETE FROM products WHERE id = ?', [id], function(err, result) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json({ message: 'Product deleted successfully' });
    });
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
    pool.query(`
        SELECT 
            COUNT(*) as total_products,
            SUM(quantity) as total_items,
            COUNT(DISTINCT category) as categories,
            SUM(quantity * price) as total_value
        FROM products
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
