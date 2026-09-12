const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Upload කරන Images සාමාන්‍ය URL එකකින් බලන්න 'uploads' folder එක Static කිරීම
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Project එකේ 'uploads' Folder එක නැතිනම් Auto සාදා දීම
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 3. Multer File Storage Configuration (ඡායාරූප Save කිරීමට)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Images save වෙන folder එක
    },
    filename: (req, file, cb) => {
        // Image එකේ නම වෙනස් නොවී unique name එකක් සෑදීම
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// MySQL Database Connection Configuration
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      // ඔබගේ MySQL Username එක මෙතනට දමන්න
    password: '',      // ඔබගේ MySQL Password එක මෙතනට දමන්න
    database: 'ilt_retail',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Database Test Connection
db.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Database Connection Error:', err.message);
    } else {
        console.log('✅ MySQL Database Connected Successfully!');
        conn.release();
    }
});

// ================= GET: All Sports =================
app.get('/api/sports', (req, res) => {
    db.query('SELECT * FROM sports', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ================= POST: Add Sport (File Upload Support) =================
app.post('/api/sports', upload.single('image'), (req, res) => {
    const { name, tagline, icon_class } = req.body;
    
    // File එකක් Upload කලා නම් එහි Path එක, නැතිනම් URL එකක් ඇත්නම් එය (එසේත් නැත්නම් NULL)
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    db.query(
        'INSERT INTO sports (name, tagline, image_url, icon_class) VALUES (?, ?, ?, ?)',
        [name, tagline, image_url, icon_class],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Sport added successfully', id: result.insertId, image_url });
        }
    );
});

// ================= GET: All Categories =================
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ================= POST: Add Category =================
app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category added successfully', id: result.insertId });
    });
});

// ================= GET: Products (With Filter Support) =================
app.get('/api/products', (req, res) => {
    const { sport_id, category_id } = req.query;

    let sql = `
        SELECT p.id, p.name AS product_title, p.image_url, p.icon_class, p.sport_id, p.category_id, s.name AS sport_name
        FROM products p
        LEFT JOIN sports s ON p.sport_id = s.id
        WHERE 1=1
    `;
    let params = [];

    if (sport_id === 'none') {
        sql += ' AND p.sport_id IS NULL';
    } else if (sport_id) {
        sql += ' AND p.sport_id = ?';
        params.push(sport_id);
    }

    if (category_id) {
        sql += ' AND p.category_id = ?';
        params.push(category_id);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ================= POST: Add Product (File Upload Support) =================
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, sport_id, category_id, icon_class } = req.body;
    
    // File එකක් Upload කලා නම් එහි Path එක, නැතිනම් URL එකක් ඇත්නම් එය (එසේත් නැත්නම් NULL)
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);
    
    // sport_id එක Empty හෝ 'null' නම් MySQL එකට NULL ලෙස යැවීම
    const sId = (sport_id && sport_id !== 'null' && sport_id !== '') ? sport_id : null;

    db.query(
        'INSERT INTO products (name, sport_id, category_id, image_url, icon_class) VALUES (?, ?, ?, ?, ?)',
        [name, sId, category_id, image_url, icon_class],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product added successfully', id: result.insertId, image_url });
        }
    );
});

// Start Express Server
app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});