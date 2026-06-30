require("dotenv").config();
const mongoose = require("mongoose");

const MenuItem = require("../models/MenuItem");
const Deal = require("../models/Deal");

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        // clear old data 
        await MenuItem.deleteMany({});
        await Deal.deleteMany({});

        // menu items
        const menuItems = [
            { name: "Zinger Burger", price: 450, category: "Burger" },
            { name: "Double Zinger Burger", price: 650, category: "Burger" },
            { name: "Chicken Wrap", price: 300, category: "Wrap" },
            { name: "Fries", price: 150, category: "Sides" },
            { name: "Coleslaw", price: 100, category: "Sides" },
            { name: "Coke", price: 120, category: "Drink" },
            { name: "Sprite", price: 120, category: "Drink" }
        ];

        // deals
        const deals = [
            {
                name: "Zinger Deal",
                description: "Zinger Burger with Fries and a Drink",
                items: ["Zinger Burger", "Fries", "Drink"],
                price: 600,
                isBestSeller: true
            },
            {
                name: "Mighty Deal",
                description: "Double Zinger Burger with Fries and a Drink",
                items: ["Double Zinger Burger", "Fries", "Drink"],
                price: 800,
                isBestSeller: false
            }
        ];

        await MenuItem.insertMany(menuItems);
        await Deal.insertMany(deals);

        console.log("Seed data inserted successfully!");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedData();