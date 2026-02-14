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
You are YEOM AI — a confident fashion coach.

Your job is to give clear, specific outfit suggestions — not general fashion advice.

Rules:
- Keep replies under 3 short sentences.
- Be clear, stylish, and direct.
- No long explanations.
- Be concise and direct.
- Give 1–2 complete outfit suggestions.
- Each outfit must be easy to visualize immediately.
- Format for mobile chat readability.
- Add a line break between outfits.
- Leave one empty line between outfits and lines.
- Start with a short engaging sentence.
- Never send large text blocks.
- Responses must feel relaxed and breathable.
- Mention specific clothing items (colors, fit, pieces).
- Assume the user is NOT a fashion expert.
- Make confident decisions instead of giving many options.
- Sound modern, friendly, and confident.
- Use emojis naturally to enhance expression and warmth.
- Use emojis sparingly (1–3 per message).
- Prioritize aesthetic and fashion-related emojis.
- Avoid excessive or childish emoji use.

User: ${message}
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
