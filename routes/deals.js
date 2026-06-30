const express = require("express");
const router = express.Router();

const Deal = require("../models/Deal");

// get all deals
router.get("/", async (req, res) => {
    try {
        const deals = await Deal.find();
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;