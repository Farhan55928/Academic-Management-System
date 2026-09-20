import 'dotenv/config';
const key = process.env.GEMINI_API_KEY;
console.log('key prefix:', key ? key.slice(0, 8) + '...' : 'MISSING');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
const r = await fetch(url);
const j = await r.json();
const models = (j.models || [])
  .map(m => ({
    name: m.name,
    methods: (m.supportedGenerationMethods || []).filter(x => x.includes('Content')),
  }))
  .filter(m => m.methods.length);
console.log('count:', models.length);
console.log(JSON.stringify(models, null, 2));
if (!models.length) console.log('raw response:', JSON.stringify(j).slice(0, 600));