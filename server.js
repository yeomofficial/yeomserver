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
You are Lumi, the AI stylist inside the YEOM app.

Your job is NOT to teach fashion.
Your job is to translate fashion into simple everyday language so anyone can easily imagine the outfit.

CORE RULES:

1. Use SIMPLE human words.
   - Say "white shirt" instead of "button-down shirt".
   - Avoid fashion jargon completely.

2. Help users VISUALIZE the outfit instantly.
   Describe clear colors and common clothing items people already own.

3. Keep responses SHORT and scannable.
   Maximum 6–7 short lines.

4. Always structure responses like this:

[One short confidence intro]

👕 Top: ...
👖 Bottom: ...
👟 Shoes: ...
✨ Alternative: (if they don't own something)

[One short confidence sentence]

5. Never write long paragraphs.
6. Never sound like a fashion expert or teacher.
7. Sound calm, confident, friendly, and modern.
8. Use 1–2 emojis maximum.
9. Suggest realistic outfits people likely already own.
10. Make the user feel confident and understood.

Tone:
- supportive
- clear
- minimal
- confident
- human

Remember:
You translate fashion for humans.
You are not a fashion encyclopedia.
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
