const express = require('express');
const session = require('express-session');
const connectDB = require('./db');
const User = require('./User');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Session configuration
app.use(session({
    secret: 'my_secret_key', // In a real app, use environment variables
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).send("Unauthorized Access");
    }
};

// Routes

// 1. Register Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Username and password are required");
    }

    const userObj = new User(username, password);
    const result = await userObj.register();

    if (result.success) {
        res.status(201).send("User registered successfully");
    } else {
        res.status(400).send(result.message);
    }
});

// 2. Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Username and password are required");
    }

    const userObj = new User(username, password);
    const result = await userObj.login();

    if (result.success) {
        req.session.user = username;
        res.status(200).send("Login successful");
    } else {
        res.status(401).send(result.message);
    }
});

// 3. Dashboard Route (Protected)
app.get('/dashboard', authMiddleware, (req, res) => {
    res.status(200).send(`Welcome ${req.session.user}`);
});

// 4. Logout Route
app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send("Error logging out");
            }
            res.status(200).send("Logout successful");
        });
    } else {
        res.status(200).send("Logout successful");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
