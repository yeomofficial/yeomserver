const express = require("express");
const { Groq } = require("groq-sdk");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

/* -------------------- CORS -------------------- */
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://yeomofficial.github.io"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  next();
});

/* -------------------- GROQ INIT -------------------- */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* -------------------- CHAT ROUTE -------------------- */
app.post("/api/chat", async (req, res) => {
  const { message, wardrobe = [], history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "No message received!" });
  }

  /* ---------- Build wardrobe text ---------- */
  let wardrobeList;

  if (wardrobe.length === 0) {
    wardrobeList =
      "User has no items saved yet. Give general simple suggestions.";
  } else {
    wardrobeList =
      "User's wardrobe (only use these items):\n" +
      wardrobe
        .map(
          (item) =>
            `- ${item.color || ""} ${
              item.name || item.category || "item"
            } (${item.category || "clothing"})`
        )
        .join("\n");
  }

  /* ---------- Conversation history ---------- */
  const historyText =
    history.length > 0
      ? history.map(h => `${h.role}: ${h.content}`).join("\n")
      : "No previous messages";

  /* ---------- Lumi Prompt ---------- */
  const fullPrompt = `
You are Lumi, a friendly AI stylist inside the YEOM app.

Your job is to help users choose outfits using ONLY the clothes they own.

------------------------
CORE BEHAVIOR
------------------------

• Be calm, friendly, and natural (like a cool friend)
• Keep replies short and clear
• Use very simple everyday words (no fashion jargon)

------------------------
WARDROBE RULE
------------------------

ONLY use items from the user's wardrobe below.
Do NOT invent clothes.

${wardrobeList}

------------------------
RESPONSE MODES
------------------------

1) OUTFIT REQUEST (when user asks what to wear)

→ Use this format:

[1 short friendly line]

👕 Top: ...
👖 Bottom: ... (skip if not needed)
👟 Shoes: ...
🧥 Layer: (only if useful)

[1 short confident closing line]

Rules:
• Max 6–7 lines
• Keep it clean and readable
• Do NOT force items that don't fit

------------------------

2) FOLLOW-UP / QUESTION (why, how, will this work, etc.)

→ Reply like a normal human
→ DO NOT use the outfit format
→ Keep it short and helpful

------------------------

3) ONE-PIECE OUTFITS (like dresses)

→ Do NOT include Bottom
→ Adjust naturally

Example:
👗 Outfit: Black dress
👟 Shoes: White sneakers

------------------------

4) CONTEXT AWARENESS

Previous conversation:
${historyText}

Rules:
• Use past messages only if helpful
• Do NOT repeat the same outfit
• Adapt based on what user said before

------------------------

5) FLEXIBILITY (VERY IMPORTANT)

Do NOT force structure if it doesn’t fit the user’s message.

------------------------

User request:
${message}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: fullPrompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_tokens: 280,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Lumi is thinking... try again!";

    res.json({ reply });

  } catch (error) {
    console.error("Groq Error:", error);

    if (error.status === 429) {
      return res
        .status(429)
        .json({
          reply:
            "Too many people chatting with Lumi right now 😅 Try again in a minute!",
        });
    }

    res.status(500).json({
      reply: "Quick break — try again in a sec!",
    });
  }
});

/* -------------------- START SERVER -------------------- */
app.listen(port, () => {
  console.log(`YEOM backend live on port ${port}`);
});
