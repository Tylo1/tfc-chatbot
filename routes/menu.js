const express = require("express");
const router = express.Router();

const MenuItem = require("../models/MenuItem");

// GET all menu items
router.get("/", async (req, res) => {
    try {
        const menuItems = await MenuItem.find();

        res.json(menuItems);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;