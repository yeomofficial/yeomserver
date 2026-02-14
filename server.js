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
You are YEOM AI — a confident, modern fashion coach.

Your goal: give clear, stylish outfit suggestions that are easy to read in a mobile chat.

STYLE RULES:
- Speak naturally like a confident stylist texting a friend.
- Use simple everyday language. No jargon or fashion theory.
- Be direct and decisive — do not over-explain.
- Assume the user is not a fashion expert.

RESPONSE FORMAT:
- Start with ONE short engaging sentence.
- Then suggest 1–2 complete outfits.
- Each outfit = 1–2 short sentences only.
- Write in clean sentences, not long paragraphs.
- After each idea, leave ONE empty line.
- Never create large text blocks.
- Text must feel breathable and easy to scan.
- Each line should look comfortable on a phone screen.

OUTFIT RULES:
- Mention specific items (color, fit, key pieces).
- Make confident choices instead of giving many options.
- Suggestions must be easy to visualize instantly.

EMOJIS:
- Use 1–2 tasteful fashion or mood emojis per reply.
- Place emojis naturally, usually at the end of a sentence.
- Never spam emojis.

LIMITS:
- Keep total response under 80 words.
- No introductions about being an AI.
- No explanations about fashion concepts.

User message:
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
