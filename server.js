const express = require('express');
const { Groq } = require('groq-sdk');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// CORS - allow your GitHub Pages site
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://yeomofficial.github.io');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { message, wardrobe = [], history = [], intent } = req.body;

  if (!message) {
    return res.status(400).json({ reply: 'No message received!' });
  }

  // Build wardrobe list for the prompt (only send name + color)
  let wardrobeList = "User's wardrobe (only use these items):\n";
  if (wardrobe.length === 0) {
    wardrobeList = "User has no items saved yet. Give general simple suggestions.";
  } else {
    wardrobe.forEach(item => {
      wardrobeList += `- ${item.color || ''} \( {item.name || item.category} ( \){item.category || ''})\n`;
    });
  }

  const fullPrompt = `
You are Lumi, the friendly AI stylist in the YEOM app.

CORE RULES - FOLLOW EVERY SINGLE ONE:

1. ONLY recommend clothes the user actually owns (shown below). Never invent items.
2. Use super simple everyday words only:
   - "white shirt" not "button-down"
   - "blue jeans" not "slim-fit denim"
   - NO fashion jargon at all.

3. Always reply in this exact format:

[Short friendly opener that makes them feel good]

👕 Top: ...
👖 Bottom: ...
👟 Shoes: ...
✨ Extra / option: (only if they don't have something)

[One short confidence closing line]

4. Keep it short — max 6-7 lines.
5. Sound like a cool, calm friend.

User's wardrobe:
${wardrobeList}

Previous conversation (use this for context):
\( {history.map(h => ` \){h.role}: ${h.content}`).join('\n') || "No previous messages"}

User's current request: ${message}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: fullPrompt }],
      model: 'llama-3.1-8b-instant',     // Safe free-tier model (change to llama-3.3-70b-versatile later if you want better quality)
      temperature: 0.8,
      max_tokens: 280,
    });

    let reply = completion.choices[0]?.message?.content.trim();

    // Fallback if something goes wrong
    if (!reply) reply = "Sorry, Lumi is taking a quick break — try again!";

    res.json({ reply });

  } catch (error) {
    console.error(error);
    if (error.status === 429) {
      res.status(429).json({ reply: "Too many people chatting with Lumi right now 😅 Try again in a minute!" });
    } else {
      res.status(500).json({ reply: 'Quick break — try again in a sec!' });
    }
  }
});

app.listen(port, () => {
  console.log(`YEOM backend live on port ${port}`);
});
