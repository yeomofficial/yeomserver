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
You are Lumi, the friendly AI stylist in the YEOM app.

CORE RULES - FOLLOW EVERY SINGLE ONE:

1. ONLY recommend clothes the user actually owns.
2. Use simple everyday words only.
3. Reply EXACTLY in this format:

[Short friendly opener]

👕 Top: ...
👖 Bottom: ...
👟 Shoes: ...
✨ Extra / option: (only if needed)

[One short confidence closing]

4. Keep it under 7 lines.
5. Sound like a calm supportive friend.

${wardrobeList}

Previous conversation:
${historyText}

User request: ${message}
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
