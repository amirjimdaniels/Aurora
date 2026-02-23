import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DalleService {
  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.DALLE_MODEL || 'dall-e-3';
  }

  async generateProfilePicture(persona) {
    const prompt = `Professional social media profile photo of a ${persona.age}-year-old ${persona.gender}. ${persona.appearance}. Photorealistic headshot, warm natural lighting, neutral background, high quality portrait photography. The person has a ${persona.personality} expression.`;

    const response = await this.client.images.generate({
      model: this.model,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data[0].url;
  }

  async downloadAndStore(imageUrl, filename) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const uploadsDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${filename}.png`);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${filename}.png`;
  }

  static getFallbackAvatar(username) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  }
}
