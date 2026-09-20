import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini provider for paper summaries.
 * Free tier (Gemini 2.5 Flash): 15 RPM, 1500 RPD, 1M-token context.
 * Override with GEMINI_MODEL=gemini-2.5-pro for higher quality.
 */

const SYSTEM_PROMPT = `I am an undergraduate student studying Computer Science.

I have uploaded a research paper. Please create a beginner-friendly,
easy-to-understand summary that I can use as a quick reference anytime.

Follow this exact structure:

---

🧠 PAPER IDENTITY
- Full Title
- Authors & Institution
- Published In & Year
- One-sentence "What is this paper about?"

---

⭐ PRIORITY SECTION — READ THIS FIRST

📋 ABSTRACT (Simplified)
- What is this paper trying to do? (1 paragraph, plain English)
- What method did they use? (1-2 sentences)
- What was the main result? (1-2 sentences)

📖 INTRODUCTION (Simplified)
- What is the background/context of this paper?
- What gap or problem motivated this research?
- What is the paper's proposed solution in simple terms?

✅ CONCLUSION (Simplified)
- What did the paper achieve?
- What are the key takeaways?
- What are the real-world implications?

---

❓ THE PROBLEM
- What problem does this paper solve?
- Why does this problem matter in real life?
- What were the existing solutions and why were they not good enough?
- Explain as if I have no prior knowledge

---

💡 THE KEY IDEA
- What is the main idea/approach of the paper?
- What makes it different or better than previous work?
- Use a simple real-life analogy to explain the core concept

---

⚙️ HOW IT WORKS (The Method)
- Explain the methodology step by step in plain English
- Avoid heavy math — if equations are important, explain what
  they mean in words, not symbols
- Use bullet points, simple diagrams (text-based), or tables
  where helpful

---

🧪 HOW IT WAS TESTED (Experiments)
- What was the experimental setup?
- What did they compare against?
- What conditions/scenarios were tested?

---

📊 RESULTS
- What were the main findings?
- Who won the comparison and by how much?
- Any surprising or important results?
- Use simple tables or comparisons where possible

---

⚠️ LIMITATIONS & FUTURE WORK
- What does this paper NOT do or assume?
- What do the authors suggest for future research?

---

🔑 KEY TERMS GLOSSARY
- List 5-10 important technical terms from the paper
- Define each one in 1-2 simple sentences
- Use everyday analogies where possible

---

📌 QUICK REFERENCE CARD
- 5 bullet points summarizing the ENTIRE paper
- Should be readable in under 1 minute
- Written as if explaining to a smart friend with
  no technical background

---

Additional instructions:
- ALWAYS start with the Priority Section (Abstract,
  Introduction, Conclusion) before anything else
- Use emojis and formatting to make it visually scannable
- Avoid jargon — if a technical term must be used,
  immediately explain it in simple words
- Use real-life analogies wherever possible
- If something is complex, break it into smaller steps
- Tone should be friendly, clear and conversational
- Prioritize understanding over technical completeness`;

let client = null;
function getClient() {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }
  // The official SDK defaults to the v1beta endpoint, but the newer
  // Gemini 3 Flash model is only served on the stable v1 endpoint. We
  // also want any v1-only future models to "just work" without code
  // changes, so pin v1 here.
  client = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
  return client;
}

// Models to try, in order. Google retires Flash aliases for new users
// regularly (2.5 → 3 → next), so we try the configured model first and
// then fall back through a small list of known-stable Flash ids. The
// first one that doesn't 404 wins.
const FALLBACK_MODELS = [
  'gemini-3-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

function isModelNotFound(err) {
  const msg = err?.message || '';
  return (
    err?.status === 404 ||
    msg.includes('is not found') ||
    msg.includes('is no longer available') ||
    msg.includes('not supported for generateContent')
  );
}

/**
 * Send a paper's extracted text to Gemini and return the markdown summary.
 * Throws on any failure — caller is responsible for marking the doc failed.
 */
export async function summarizeWithGemini({ paperText, paperTitle }) {
  const configured = process.env.GEMINI_MODEL;
  const candidates = configured
    ? [configured, ...FALLBACK_MODELS.filter(m => m !== configured)]
    : FALLBACK_MODELS;

  const userMsg = paperTitle
    ? `Paper title: ${paperTitle}\n\n---\n\n${paperText}`
    : paperText;

  let lastErr;
  for (const modelName of candidates) {
    try {
      const model = getClient().getGenerativeModel({
        model: modelName,
        generationConfig: {
          // 4k tokens is enough for the template (~2.5k words). Higher gives
          // the model room to include tables.
          maxOutputTokens: 4096,
          // Lower = more faithful to template structure. 0.3 strikes a good
          // balance between rigid format and natural prose.
          temperature: 0.3,
        },
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(userMsg);
      const text = result?.response?.text?.();
      if (!text) throw new Error('Gemini returned an empty response');

      // Strip code fences if the model wrapped its output (it shouldn't,
      // but defensive).
      const cleaned = text
        .replace(/^```(?:markdown|md)?\s*\n/i, '')
        .replace(/\n```\s*$/i, '')
        .trim();

      if (modelName !== candidates[0]) {
        console.warn(`[gemini] fell back to "${modelName}" after "${candidates[0]}" failed`);
      }
      return cleaned;
    } catch (err) {
      lastErr = err;
      if (!isModelNotFound(err)) throw err; // real error, give up
      console.warn(`[gemini] model "${modelName}" unavailable: ${err?.message?.slice(0, 120)}`);
    }
  }
  throw lastErr || new Error('All Gemini model fallbacks failed');
}
