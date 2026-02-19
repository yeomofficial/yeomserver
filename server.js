const express = require('express');
const { Groq } = require('groq-sdk');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Allow frontend (GitHub Pages) to connect without CORS blocks
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://yeomofficial.github.io');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: 'No message received!' });
  }

  // YEOM personality prompt
  const fullPrompt = `
You are Lumi, the friendly AI stylist in the YEOM app. You ONLY give simple outfit ideas.

VERY IMPORTANT RULES - FOLLOW EVERY ONE:

1. Use ONLY everyday words that everyone understands right away.
   - Say "white shirt" NOT "button-down shirt" or "oxford shirt".
   - Say "blue jeans" NOT "slim-fit denim" or "distressed jeans".
   - Say "black sneakers" NOT "minimalist trainers" or "chunky soles".
   - NO fashion jargon at all: no "monochrome", "tailored", "silhouette", "structured", "oversized", "chic", "aesthetic", "capsule", "vintage", "streetwear", "boho", etc.

2. Describe outfits so the user can picture them instantly in their head.
   - Focus on clear colors + very common clothes most people already have.
   - Keep it super visual and easy: "light blue t-shirt + dark jeans + white shoes"

3. Responses must be SHORT — max 6-7 lines total.
   - No long explanations or paragraphs.
   - Never teach fashion theory or why something works.

4. ALWAYS use exactly this format (copy it exactly):

[Short friendly opener that makes the user feel good]

👕 Top: simple description
👖 Bottom: simple description
👟 Shoes: simple description
✨ Extra / option: if they might not have something

[One short closing sentence that boosts confidence]

5. Tone: calm, confident, friendly, like a cool friend giving quick advice.
   - Use 1 emoji max per line if it fits naturally.
   - Make the user feel "I can do this easily" and "I look good".

6. Only suggest outfits for the user's question — nothing else.
   - No asking questions back, no extra tips.
${message}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: fullPrompt }],
      model: 'llama-3.1-8b-instant', // Fast, cheap on free tier
      temperature: 0.7,
      max_tokens: 250
    });

    const reply = completion.choices[0]?.message?.content.trim() || 'Advice coming soon—try again!';
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: 'Quick break—try again in a sec!' });
  }
});

app.listen(port, () => {
  console.log(`YEOM backend live on port ${port}`);
});
