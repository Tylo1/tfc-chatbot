const express = require("express");
const router = express.Router();

const Groq = require("groq-sdk");

const MenuItem = require("../models/MenuItem");
const Deal = require("../models/Deal");

// Create Groq AI instance using .env key
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
const ChatMessage = require("../models/ChatMessage");

router.get("/history", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" });
    }
    const messages = await ChatMessage.find({ userId: req.session.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    res.json(messages.reverse());
});

// chat endpoint
router.post("/", async (req, res) => {

    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Not logged in" });
        }
        const userId = req.session.userId;

        const userMessage = req.body.message;

        if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        if (userMessage.length > 500) {
            return res.status(400).json({ message: "Message too long. Please keep it under 500 characters." });
        }

        await ChatMessage.create({
            role: "user",
            content: userMessage,
            userId: userId
        });

        // block to preventing ordering behaviour
        const lowerMsg = userMessage.toLowerCase();

        if (
            lowerMsg.includes("order") ||
            lowerMsg.includes("add to order") ||
            lowerMsg.includes("i'll take") ||
            lowerMsg.includes("i will take") ||
            lowerMsg.includes("checkout")
        ) {
            const declineReply = "I am unable to take orders. If you wish to place an order, please contact the restaurant directly.";
            await ChatMessage.create({
                role: "assistant",
                content: declineReply,
                userId: userId
            });
            return res.json({ reply: declineReply, images: [] });
        }

        // Get live data from MongoDB
        const menu = await MenuItem.find();
        const deals = await Deal.find();

        // Build AI context
        const systemPrompt = `
You are "TFC", an information-only assistant for Taha Fried Chicken (TFC).

STRICT RULES:
- NEVER take orders, simulate purchases, or guide checkout
- If user tries to order, decline politely and do not process it
- ONLY answer what is directly asked
- NEVER mix MENU and DEALS unless both are asked
- ONLY use items from the data below — if not listed, say "Not available in our menu"
- If asked about quantity/stock say: "We do not track item quantities."
- Be short, clear, direct. No greetings unless user greets first. Always refer to yourself as "TFC"
- NEVER mention images or say you cannot show images

MENU:
${menu.map(item => `${item.name} - Rs ${item.price}`).join("\n")}

DEALS:
${deals.map(deal =>
            `${deal.name} - Rs ${deal.price} | Includes: ${deal.items?.join(", ") || "Not specified"}${deal.isBestSeller ? " | BEST SELLER" : ""}`
        ).join("\n")}
`;

        const imageMap = {
            "zinger burger": "images/zinger.jpeg",
            "double zinger burger": "images/mighty.jpeg",
            "chicken wrap": "images/wrap.avif",
            "fries": "images/fries.png",
            "coleslaw": "images/cole.jpeg",
            "coke": "images/coke.jpeg",
            "sprite": "images/sprite.jpeg",
            "zinger deal": "images/zdeal.png",
            "mighty deal": "images/mdeal.png"
        };

        // Call Groq AI
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...await ChatMessage.find({ userId: userId }).sort({ createdAt: -1 }).limit(6).lean().then(msgs => {
                    const ordered = msgs.reverse();
                    const firstUserIdx = ordered.findIndex(m => m.role === "user");
                    return ordered.slice(firstUserIdx).map(m => ({ role: m.role, content: m.content }));
                })
            ]
        });

        const botReply = response.choices[0].message.content;
        if (!botReply) {
            return res.status(500).json({ reply: "Sorry, I could not generate a response. Please try again.", images: [] });
        }

        // Detect images based on user message AND bot reply
        const lowerReply = botReply.toLowerCase();
        const images = [];
        const combined = lowerReply + " " + lowerMsg;

        // Check deals first (more specific)
        const dealKeywords = ["zinger deal", "mighty deal"];
        const matchedDeals = new Set();

        for (const keyword of dealKeywords) {
            if (combined.includes(keyword)) {
                images.push(imageMap[keyword]);
                matchedDeals.add(keyword);
            }
        }

        // Only add individual items if no deal was matched that contains them
        const zingerDealMatched = matchedDeals.has("zinger deal");
        const mightyDealMatched = matchedDeals.has("mighty deal");

        const matchedKeywords = [];
        for (const [keyword, imgPath] of Object.entries(imageMap)) {
            if (dealKeywords.includes(keyword)) continue;
            if (zingerDealMatched && ["zinger burger", "fries", "coke", "sprite"].includes(keyword)) continue;
            if (mightyDealMatched && ["double zinger burger", "zinger burger", "fries", "coke", "sprite"].includes(keyword)) continue;
            if (combined.includes(keyword)) {
                matchedKeywords.push(keyword);
            }
        }

        // Remove "zinger burger" if "double zinger burger" is also matched (substring conflict)
        if (matchedKeywords.includes("double zinger burger") && matchedKeywords.includes("zinger burger")) {
            matchedKeywords.splice(matchedKeywords.indexOf("zinger burger"), 1);
        }

        matchedKeywords.forEach(keyword => images.push(imageMap[keyword]));

        await ChatMessage.create({
            role: "assistant",
            content: botReply,
            userId: userId
        });

        // Send reply back to frontend
        res.json({ reply: botReply, images });

    } catch (error) {
        console.log("Chat error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;