import Paper from '../models/Paper.js';
import User from '../models/User.js';
import { downloadDriveFile } from './googleDriveService.js';
import { summarize } from './providers/index.js';
// pdf-parse is CommonJS; ESM interop may wrap it as { default: fn }.
import pdfParsePkg from 'pdf-parse';
const pdfParse = pdfParsePkg.default || pdfParsePkg;

/**
 * Cap how much text we send to the LLM. Most papers are < 50k words, but
 * some surveys are huge — we trim to keep latency reasonable and stay
 * well within Gemini's per-request limit. The full PDF stays in Drive
 * untouched.
 */
const MAX_TEXT_CHARS = 120_000;

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function trimText(s) {
  if (s.length <= MAX_TEXT_CHARS) return s;
  // Prefer to cut at a paragraph boundary so the model doesn't get a
  // sentence fragment as its last input.
  const cut = s.slice(0, MAX_TEXT_CHARS);
  const lastPara = cut.lastIndexOf('\n\n');
  return lastPara > MAX_TEXT_CHARS * 0.7 ? cut.slice(0, lastPara) : cut;
}

/**
 * Fire-and-forget summary generator. Loads the paper, fetches the PDF
 * from Drive, extracts text, calls the LLM, and persists the result.
 *
 * Idempotent on (userId, paperId). Safe to call again to retry — the
 * status flips to 'generating' at the start so any UI in flight updates.
 */
export async function generateSummaryAsync(paperId) {
  let paper;
  try {
    paper = await Paper.findById(paperId);
    if (!paper) {
      console.warn('[summary] paper not found:', paperId);
      return;
    }

    await Paper.updateOne(
      { _id: paperId },
      { $set: { summaryStatus: 'generating', summaryError: '' } }
    );

    const user = await User.findById(paper.userId);
    if (!user || !user.googleRefreshToken) {
      throw new Error('User not connected to Google Drive');
    }

    // 1. Pull the PDF binary back out of Drive
    const stream = await downloadDriveFile(user, paper.driveFileId);
    const buffer = await streamToBuffer(stream);

    // 2. Extract text
    const parsed = await pdfParse(buffer);
    const paperText = trimText(parsed.text || '');
    if (!paperText.trim()) {
      throw new Error('Could not extract any text from this PDF (it may be a scanned image)');
    }

    // 3. Ask the LLM
    const markdown = await summarize({
      paperText,
      paperTitle: paper.title,
    });

    // 4. Persist
    await Paper.updateOne(
      { _id: paperId },
      {
        $set: {
          summaryStatus: 'ready',
          summaryMarkdown: markdown,
          summaryGeneratedAt: new Date(),
          summaryError: '',
        },
      }
    );
    console.log(`[summary] paper ${paperId} summarized (${markdown.length} chars)`);
  } catch (err) {
    console.error('[summary] failed for paper', paperId, err?.message);
    await Paper.updateOne(
      { _id: paperId },
      {
        $set: {
          summaryStatus: 'failed',
          summaryError: err?.message || String(err),
        },
      }
    ).catch(() => {}); // ignore secondary failure
  }
}
