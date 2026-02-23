#!/usr/bin/env node
import 'dotenv/config';
import { createSyntheticUsers } from '../services/syntheticUsers/userCreator.js';

const args = process.argv.slice(2);
const flags = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--count' && args[i + 1]) {
    flags.count = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--no-images') {
    flags.noImages = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    flags.help = true;
  }
}

if (flags.help) {
  console.log(`
Usage: node scripts/generate-users.js [options]

Options:
  --count <n>     Number of synthetic users to create (default: 5, max: 50)
  --no-images     Skip DALL-E image generation, use DiceBear avatars instead
  --help, -h      Show this help message

Examples:
  node scripts/generate-users.js --count 3
  node scripts/generate-users.js --count 10 --no-images
`);
  process.exit(0);
}

const count = Math.min(Math.max(flags.count || 5, 1), 50);
const generateImages = !flags.noImages;

console.log(`\n=== Aurora Synthetic User Generator ===`);
console.log(`Creating ${count} user(s), images: ${generateImages ? 'DALL-E' : 'DiceBear fallback'}\n`);

try {
  const results = await createSyntheticUsers(count, {
    generateImages,
    progressCallback: (msg) => console.log(msg),
  });

  console.log(`\n=== Results ===`);
  console.log(`Created: ${results.created.length}`);
  console.log(`Errors:  ${results.errors.length}`);

  if (results.created.length > 0) {
    console.log(`\nUsers created:`);
    for (const u of results.created) {
      console.log(`  - ${u.username} (ID: ${u.id}, ${u.postsCreated} posts)`);
    }
  }

  if (results.errors.length > 0) {
    console.log(`\nErrors:`);
    for (const e of results.errors) {
      console.log(`  - User #${e.index + 1}: ${e.error}`);
    }
  }

  process.exit(0);
} catch (err) {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
}
