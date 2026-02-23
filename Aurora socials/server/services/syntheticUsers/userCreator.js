import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import { generatePersona } from './personaGenerator.js';
import { generatePostsForPersona } from './postGenerator.js';
import { DalleService } from '../imageGen/DalleService.js';

// Reuse hashtag extraction pattern from routes/posts.js
function extractHashtags(content) {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

async function linkHashtagsToPost(postId, hashtags) {
  for (const tagName of hashtags) {
    let hashtag = await prisma.hashtag.findUnique({ where: { name: tagName } });
    if (!hashtag) {
      hashtag = await prisma.hashtag.create({ data: { name: tagName } });
    }
    await prisma.postHashtag.upsert({
      where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
      update: {},
      create: { postId, hashtagId: hashtag.id },
    });
  }
}

export async function createSyntheticUsers(count, options = {}) {
  const { generateImages = true, progressCallback = console.log } = options;

  const dalleService = generateImages && process.env.OPENAI_API_KEY
    ? new DalleService()
    : null;

  const results = { created: [], errors: [] };

  for (let i = 0; i < count; i++) {
    try {
      // 1. Generate persona via LLM
      progressCallback(`[${i + 1}/${count}] Generating persona...`);
      const persona = await generatePersona();

      // 2. Ensure username uniqueness
      let username = persona.username?.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20);
      if (!username || username.length < 3) username = `user_${Date.now() % 100000}`;
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) username = `${username}${Date.now() % 10000}`;

      progressCallback(`[${i + 1}/${count}] Creating user: ${username}`);

      // 3. Generate or fallback profile picture
      let profilePicture;
      if (dalleService) {
        try {
          progressCallback(`[${i + 1}/${count}] Generating profile photo with DALL-E...`);
          const tempUrl = await dalleService.generateProfilePicture(persona);
          profilePicture = await dalleService.downloadAndStore(tempUrl, `synth-${username}`);
        } catch (imgErr) {
          progressCallback(`[${i + 1}/${count}] DALL-E failed, using DiceBear fallback`);
          profilePicture = DalleService.getFallbackAvatar(username);
        }
      } else {
        profilePicture = DalleService.getFallbackAvatar(username);
      }

      // 4. Create user in database
      const hashedPassword = await bcrypt.hash(
        process.env.SYNTHETIC_USER_PASSWORD || 'SyntheticUser2026!',
        10
      );

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email: `${username}@synthetic.aurora.local`,
          bio: persona.bio?.slice(0, 500) || '',
          profilePicture,
          birthday: persona.birthday || null,
          location: persona.location || null,
          isSynthetic: true,
        },
      });

      // 5. Generate posts for this user
      progressCallback(`[${i + 1}/${count}] Generating posts for ${username}...`);
      const postData = await generatePostsForPersona(persona);
      const posts = postData.posts || postData;
      let postsCreated = 0;

      for (const post of posts) {
        try {
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - (post.daysAgo || 0));

          const newPost = await prisma.post.create({
            data: {
              content: post.content,
              authorId: user.id,
              createdAt,
            },
          });

          // Extract and link hashtags
          const hashtags = extractHashtags(post.content);
          if (hashtags.length > 0) {
            await linkHashtagsToPost(newPost.id, hashtags);
          }

          // Create poll if applicable
          if (post.type === 'poll' && post.pollOptions?.length >= 2) {
            await prisma.poll.create({
              data: {
                postId: newPost.id,
                question: post.pollQuestion || 'What do you think?',
                options: {
                  create: post.pollOptions.map(text => ({ text })),
                },
              },
            });
          }

          postsCreated++;
        } catch (postErr) {
          console.error(`[SyntheticUser] Failed to create post for ${username}:`, postErr.message);
          progressCallback(`[${i + 1}/${count}] Post error: ${postErr.message}`);
        }
      }

      results.created.push({ id: user.id, username, postsCreated });
      progressCallback(`[${i + 1}/${count}] Created ${username} with ${postsCreated} posts`);

      // Rate limit delay for DALL-E (5 images/min)
      if (dalleService && i < count - 1) {
        progressCallback(`[${i + 1}/${count}] Waiting 15s for DALL-E rate limit...`);
        await new Promise(r => setTimeout(r, 15000));
      }
    } catch (err) {
      const errorDetail = err.stack ? `${err.message}\n${err.stack.split('\n')[1]?.trim()}` : err.message;
      console.error(`[SyntheticUser] Error creating user ${i + 1}:`, errorDetail);
      progressCallback(`[${i + 1}/${count}] ERROR: ${err.message}`);
      results.errors.push({ index: i, error: err.message });
    }
  }

  return results;
}
