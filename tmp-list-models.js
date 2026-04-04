const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/GEMINI_API_KEY=(.*)/);
if (!match) {
  throw new Error('GEMINI_API_KEY not found in .env');
}
const key = match[1].trim();

async function main() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
  const text = await res.text();
  console.log('status', res.status);
  console.log(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
