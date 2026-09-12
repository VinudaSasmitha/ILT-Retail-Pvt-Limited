const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 1. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Dynamic Uploads Folder Setup
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. MySQL Connection (multipleStatements: true එකතු කර ඇත)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'ilt_retail',
    multipleStatements: true // <-- Queries කිහිපයක් එකවර ක්‍රියාත්මක කිරීමට මෙය අවශ්‍ය වේ
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database Connection Error:', err);
        return;
    }
    console.log('✅ MySQL Database Connected Successfully!');

    // Automatic Tables Creation
    const createTables = `
        CREATE TABLE IF NOT EXISTS sports_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            sport_id INT NULL,
            category_id INT NOT NULL,
            image_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    db.query(createTables, (tableErr) => {
        if (tableErr) {
            console.error('Error creating tables:', tableErr);
        } else {
            console.log('✅ All Database Tables Ready!');
        }
    });
});

// 3. Multer Setup
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 4. API Routes
app.get('/api/sports', (req, res) => {
    const sql = `
        SELECT s.*, COUNT(p.id) AS product_count 
        FROM sports_categories s 
        LEFT JOIN products p ON s.id = p.sport_id 
        GROUP BY s.id 
        ORDER BY s.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, data: results });
    });
});

app.post('/api/sports', upload.any(), (req, res) => {
    const { name, tagline } = req.body;
    let iconValue = '';
    if (req.files && req.files.length > 0) {
        iconValue = `/uploads/${req.files[0].filename}`;
    }

    const sql = 'INSERT INTO sports_categories (name, description, icon) VALUES (?, ?, ?)';
    db.query(sql, [name, tagline || '', iconValue], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: 'Sport added successfully!' });
    });
});

app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(results);
    });
});

app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: 'Category added!' });
    });
});

app.get('/api/products', (req, res) => {
    const sql = `
        SELECT p.*, p.name AS product_title, s.name AS sport_name 
        FROM products p 
        LEFT JOIN sports_categories s ON p.sport_id = s.id 
        ORDER BY p.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(results);
    });
});

app.post('/api/products', upload.any(), (req, res) => {
    const { name, sport_id, category_id } = req.body;
    let imageUrl = '';
    if (req.files && req.files.length > 0) {
        imageUrl = `/uploads/${req.files[0].filename}`;
    }

    const sql = 'INSERT INTO products (name, sport_id, category_id, image_url) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, sport_id || null, category_id, imageUrl], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: 'Product added!' });
    });
});

// Start Server
app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});