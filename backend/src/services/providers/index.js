import { summarizeWithGemini } from './geminiProvider.js';

/**
 * Provider selector. To swap LLMs in the future:
 *   1. Create providers/<name>Provider.js exporting summarizeWith<Name>(...)
 *   2. Add a case below.
 *   3. Set SUMMARY_PROVIDER=<name> in the env.
 *
 * Default is Gemini (free, 1M-token context, strong structured output).
 */
const providers = {
  gemini: summarizeWithGemini,
};

export function summarize({ paperText, paperTitle }) {
  const name = process.env.SUMMARY_PROVIDER || 'gemini';
  const fn = providers[name];
  if (!fn) throw new Error(`Unknown SUMMARY_PROVIDER: ${name}`);
  return fn({ paperText, paperTitle });
}
