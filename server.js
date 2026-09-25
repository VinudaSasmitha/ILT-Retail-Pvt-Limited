require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (Public Folder)
app.use(express.static(path.join(__dirname, 'public')));

// Uploads Folder Setup
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// MySQL Connection Config
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'ilt_retail'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database Connection Error:', err);
        return;
    }
    console.log('✅ MySQL Database Connected Successfully!');
});

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- SPORTS API ---
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
    db.query(sql, [name || '', tagline || '', iconValue], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: 'Sport added successfully!' });
    });
});

// --- CATEGORIES API ---
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(results);
    });
});

app.post('/api/categories', upload.any(), (req, res) => {
    const { name } = req.body;
    let imageUrl = '';
    
    if (req.files && req.files.length > 0) {
        imageUrl = `/uploads/${req.files[0].filename}`;
    }

    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const sql = 'INSERT INTO categories (name, image_url) VALUES (?, ?)';
    db.query(sql, [name, imageUrl], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: 'Category added successfully!' });
    });
});

// --- PRODUCTS API ---
// 1. GET ALL PRODUCTS
app.get('/api/products', (req, res) => {
    const { sport, category, type, search } = req.query;

    let sql = `
        SELECT p.*, 
               p.name AS product_title, 
               s.name AS sport_name, 
               c.name AS category_name 
        FROM products p 
        LEFT JOIN sports_categories s ON p.sport_id = s.id 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    `;
    const params = [];

    if (sport && sport !== 'all') {
        if (!isNaN(sport)) {
            sql += ` AND p.sport_id = ?`;
            params.push(parseInt(sport));
        } else {
            sql += ` AND s.name = ?`;
            params.push(sport);
        }
    }

    if (category && category !== 'all') {
        if (!isNaN(category)) {
            sql += ` AND p.category_id = ?`;
            params.push(parseInt(category));
        } else {
            sql += ` AND c.name = ?`;
            params.push(category);
        }
    }

    if (type && type !== 'all') {
        sql += ` AND p.type = ?`;
        params.push(type);
    }

    if (search && search.trim() !== '') {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY p.id DESC`;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json(results);
    });
});

// 2. GET SINGLE PRODUCT
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.*, 
               p.name AS product_title,
               s.name AS sport_name, 
               c.name AS category_name,
               GROUP_CONCAT(pi.image_url) AS extra_images
        FROM products p 
        LEFT JOIN sports_categories s ON p.sport_id = s.id 
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.id = ?
        GROUP BY p.id
    `;

    db.query(sql, [parseInt(id)], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });

        const product = results[0];
        let images = [];

        if (product.image_url) images.push(product.image_url);

        if (product.extra_images) {
            const extras = product.extra_images.split(',');
            extras.forEach(img => {
                if (!images.includes(img)) images.push(img);
            });
        }

        res.status(200).json({ ...product, images });
    });
});

// 3. POST PRODUCT
app.post('/api/products', upload.any(), (req, res) => {
    const { name, sport_id, category_id, type, price, description } = req.body;
    let mainImageUrl = '';

    if (req.files && req.files.length > 0) {
        mainImageUrl = `/uploads/${req.files[0].filename}`;
    }

    const validSportId = (sport_id && sport_id !== '' && sport_id !== 'null' && sport_id !== 'undefined') ? parseInt(sport_id) : null;
    const validCategoryId = (category_id && category_id !== '' && category_id !== 'null') ? parseInt(category_id) : null;

    if (!name || !validCategoryId) {
        return res.status(400).json({ success: false, error: 'Product name and Category ID are required.' });
    }

    const sql = 'INSERT INTO products (name, description, sport_id, category_id, type, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, description || null, validSportId, validCategoryId, type || null, price || 0.00, mainImageUrl], (err, result) => {
        if (err) {
            console.error('❌ SQL Error (POST /api/products):', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        const productId = result.insertId;

        // Save extra images
        if (req.files && req.files.length > 0) {
            const imageValues = req.files.map(file => [productId, `/uploads/${file.filename}`]);
            const imgSql = 'INSERT INTO product_images (product_id, image_url) VALUES ?';
            
            db.query(imgSql, [imageValues], (imgErr) => {
                if (imgErr) console.error('❌ Error saving extra images:', imgErr.message);
                return res.status(200).json({ success: true, message: 'Product added successfully!' });
            });
        } else {
            return res.status(200).json({ success: true, message: 'Product added successfully!' });
        }
    });
});

// 4. DELETE PRODUCT
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM products WHERE id = ?', [parseInt(id)], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: 'Product deleted successfully!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});