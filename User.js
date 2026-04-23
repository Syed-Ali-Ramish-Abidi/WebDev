const mongoose = require('mongoose');

// Define Schema for Users Collection
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Avoid recompiling model if already exists
const UserModel = mongoose.models.users || mongoose.model('users', userSchema);

class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async register() {
        try {
            const newUser = new UserModel({
                username: this.username,
                password: this.password
            });
            await newUser.save();
            return { success: true, message: "User registered successfully" };
        } catch (err) {
            // Handle duplicate key error or other errors
            if (err.code === 11000) {
                return { success: false, message: "Username already exists" };
            }
            return { success: false, message: err.message };
        }
    }

    async login() {
        try {
            const user = await UserModel.findOne({
                username: this.username,
                password: this.password
            });

            if (user) {
                return { success: true, message: "Login successful" };
            } else {
                return { success: false, message: "Invalid username or password" };
            }
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
}

module.exports = User;
