const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend සහ Admin files serve කිරීමට
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'db.json');

// Default Data File එක නැත්නම් නිර්මාණය කිරීම
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        sports: [
            { id: "1", title: "RUGBY", sub: "PERFORMANCE", icon: "fa-rugby-ball", image: "https://e0.365dm.com/25/09/1600x900/skysports-damian-williamse_7018622.jpg?20250913090815" },
            { id: "2", title: "CRICKET", sub: "CUSTOM WHITES & COLORS", icon: "fa-cricket-bat-ball", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHK-ROtTQ-OLmPI6303YuXGYI9g2mwKOb4pX9YytwYOHZhmSSNOawrmKr-&s=10" },
            { id: "3", title: "BASKETBALL", sub: "MESH SINGLETS", icon: "fa-basketball", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT89DNUgKDDs8kEAPwDo95f7Rb9HU2ujevHBomync19YuVUEtjynkb0C0A&s=10" },
            { id: "4", title: "FOOTBALL", sub: "MATCHWEAR & KITS", icon: "fa-futbol", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyzbRZnKg0JiBh5tlEPpzh2MSror_yL5hpWTCw4jvRFEYY2LgkpBhwgsoJ&s=10" },
            { id: "5", title: "BOXING", sub: "COMBAT & GLOVES", icon: "fa-mitten", image: "https://cdn.britannica.com/76/187976-050-D8DA2DA7/Floyd-Mayweather-Jr-ducks-Philippines-Manny-Pacquiao-May-2-2015.jpg" }
        ],
        products: [
            { id: "1", title: "Rugby Jersey", sport: "RUGBY", icon: "fa-shirt", image: "images/rugby-jersey.jpg" },
            { id: "2", title: "Rugby Shorts", sport: "RUGBY", icon: "fa-socks", image: "images/rugby-shorts.jpg" },
            { id: "3", title: "Cricket Jerseys", sport: "CRICKET", icon: "fa-shirt", image: "images/cricket-jerseys.jpg" },
            { id: "4", title: "Basketball Kits", sport: "BASKETBALL", icon: "fa-shirt", image: "images/basketball-kits.jpg" },
            { id: "5", title: "Football Kit", sport: "FOOTBALL", icon: "fa-shirt", image: "images/football-kit.jpg" }
        ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function getDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- SPORTS ENDPOINTS ---
app.get('/api/sports', (req, res) => {
    res.json(getDB().sports);
});

app.post('/api/sports', (req, res) => {
    const db = getDB();
    const newSport = { id: Date.now().toString(), ...req.body };
    db.sports.push(newSport);
    saveDB(db);
    res.status(201).json(newSport);
});

app.delete('/api/sports/:id', (req, res) => {
    const db = getDB();
    db.sports = db.sports.filter(s => s.id !== req.params.id);
    saveDB(db);
    res.json({ message: "Sport category deleted" });
});

// --- PRODUCTS ENDPOINTS ---
app.get('/api/products', (req, res) => {
    const db = getDB();
    const { sport } = req.query;
    if (sport && sport !== 'ALL') {
        const filtered = db.products.filter(p => p.sport.toUpperCase() === sport.toUpperCase());
        return res.json(filtered);
    }
    res.json(db.products);
});

app.post('/api/products', (req, res) => {
    const db = getDB();
    const newProduct = { id: Date.now().toString(), ...req.body };
    db.products.push(newProduct);
    saveDB(db);
    res.status(201).json(newProduct);
});

app.delete('/api/products/:id', (req, res) => {
    const db = getDB();
    db.products = db.products.filter(p => p.id !== req.params.id);
    saveDB(db);
    res.json({ message: "Product deleted" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));