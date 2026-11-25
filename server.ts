import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Runtime public configuration for Google Maps client SDK
  app.get('/api/config', (_req: Request, res: Response) => {
    const mapsApiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      '';
    res.json({ mapsApiKey });
  });

  // AI Full Coffee Shop View endpoint using Gemini structured JSON schema
  app.post('/api/ai/shop-view', async (req: Request, res: Response) => {
    try {
      const { prompt, shopData } = req.body ?? {};
      const userPrompt =
        typeof prompt === 'string' && prompt.trim().length > 0
          ? prompt.trim()
          : 'Give me a complete architectural and sensory tour of the coffee shop with a signature drink and pastry pairing.';

      if (!shopData || !Array.isArray(shopData.spatialZones) || !Array.isArray(shopData.menuItems)) {
        res.status(400).json({ error: 'Valid shopData JSON payload with spatialZones and menuItems is required.' });
        return;
      }

      const ai = getGeminiClient();

      const zoneSummary = shopData.spatialZones
        .map((z: { id: string; name: string; seating: string; acoustics: string; lighting: string; description: string }) =>
          `- ${z.id} (${z.name}): ${z.seating}, ${z.acoustics}, ${z.lighting}. ${z.description}`
        )
        .join('\n');

      const menuSummary = shopData.menuItems
        .map((m: { id: string; name: string; category: string; priceUsd: number; origin: string; tastingNotes: string[] }) =>
          `- ${m.id}: ${m.name} (${m.category}, $${m.priceUsd}) — ${m.origin}, notes: ${Array.isArray(m.tastingNotes) ? m.tastingNotes.join(', ') : ''}`
        )
        .join('\n');

      const systemInstruction = [
        `You are the spatial curator and head barista at ${shopData.shop?.name ?? 'Kestrel Roastery'}.`,
        'Generate a personalized, accurate Full Coffee Shop View tour strictly grounded in the provided JSON shop data.',
        'Always select recommendedZoneId from the exact zone IDs provided, and curatedOrder itemId values from the exact menu item IDs provided.',
        'Keep language grounded, sensory, concise, and free of hype or technical jargon.',
      ].join(' ');

      const fullPrompt = [
        `Visitor Request: "${userPrompt}"`,
        '',
        `Shop Location: ${shopData.location?.address ?? ''} (${shopData.location?.neighborhood ?? ''})`,
        '',
        'Available Spatial Zones (use exact zone id):',
        zoneSummary,
        '',
        'Available Menu Items (use exact item id):',
        menuSummary,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: fullPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: 'Short editorial headline for this personalized coffee shop view (under 10 words).',
              },
              recommendedZoneId: {
                type: Type.STRING,
                description: 'Exact ID of the best matching spatial zone from the provided JSON zones.',
              },
              atmosphereSummary: {
                type: Type.STRING,
                description: 'Two-sentence sensory overview of light, sound, and aroma across the coffee shop.',
              },
              curatedOrder: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemId: { type: Type.STRING },
                    itemName: { type: Type.STRING },
                    customization: { type: Type.STRING },
                    pairingReason: { type: Type.STRING },
                  },
                  required: ['itemId', 'itemName', 'customization', 'pairingReason'],
                },
              },
              spatialWalkthrough: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.INTEGER },
                    zoneName: { type: Type.STRING },
                    sensoryDetail: { type: Type.STRING },
                    recommendedDurationMin: { type: Type.INTEGER },
                  },
                  required: ['step', 'zoneName', 'sensoryDetail', 'recommendedDurationMin'],
                },
              },
              baristaJsonSpecs: {
                type: Type.OBJECT,
                properties: {
                  brewMethod: { type: Type.STRING },
                  grindProfile: { type: Type.STRING },
                  waterTempC: { type: Type.NUMBER },
                  suggestedSeat: { type: Type.STRING },
                },
                required: ['brewMethod', 'grindProfile', 'waterTempC', 'suggestedSeat'],
              },
            },
            required: [
              'headline',
              'recommendedZoneId',
              'atmosphereSummary',
              'curatedOrder',
              'spatialWalkthrough',
              'baristaJsonSpecs',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate AI shop view.';
      console.error('AI shop-view error:', message);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
