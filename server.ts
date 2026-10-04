import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderHandle: string;
  senderName: string;
  recipientId: string;
  text: string;
  timestamp: string;
}

interface ConnectedPresence {
  uid: string;
  handle: string;
  displayName: string;
}

// Server-authoritative state for real-time chat & presence
const serverMessages: ServerChatMessage[] = [
  {
    id: 'srv_msg_welcome_1',
    roomId: 'curator_valeria_botanica__local_collector',
    senderId: 'curator_valeria_botanica',
    senderHandle: 'valeria.herbario',
    senderName: 'Dra. Valeria Montes',
    recipientId: 'local_collector',
    text: '¡Hola! Vi tus registros de campo en Biofolio. Si encuentras alguna cactácea o arácea interesante, compártela por aquí.',
    timestamp: '2026-10-03T16:30:00.000Z',
  },
  {
    id: 'srv_msg_welcome_2',
    roomId: 'curator_mateo_fauna__local_collector',
    senderId: 'curator_mateo_fauna',
    senderHandle: 'mateo.naturalista',
    senderName: 'Mateo Ríos',
    recipientId: 'local_collector',
    text: '¡Saludos! Qué buena colección estás armando. Avísame cuando subas nuevos hallazgos de fauna o entomología.',
    timestamp: '2026-10-03T17:15:00.000Z',
  },
];

const clientPresence = new Map<WebSocket, ConnectedPresence>();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  // Enable CORS so static frontends (like GitHub Pages) and mobile PWAs can call /api/*
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Support base64 photo uploads up to 10MB
  app.use(express.json({ limit: '10mb' }));

  // WebSocket Server for Real-Time Direct Messaging & Presence (attached to port 3000)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws-chat' });

  const broadcastEvent = (payload: unknown) => {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  };

  const broadcastPresence = () => {
    const activeUsers = Array.from(clientPresence.values());
    broadcastEvent({
      type: 'presence:sync',
      users: activeUsers,
    });
  };

  wss.on('connection', (ws) => {
    // 1. Initial State Sync on connection
    ws.send(
      JSON.stringify({
        type: 'chat:init',
        messages: serverMessages.slice(-200),
        users: Array.from(clientPresence.values()),
      })
    );

    ws.on('message', (rawBuffer) => {
      try {
        const event = JSON.parse(rawBuffer.toString());

        if (event.type === 'user:join' && event.user?.uid) {
          clientPresence.set(ws, {
            uid: String(event.user.uid).slice(0, 128),
            handle: String(event.user.handle || 'naturalista').slice(0, 40),
            displayName: String(event.user.displayName || 'Coleccionista').slice(0, 80),
          });
          broadcastPresence();
        } else if (event.type === 'message:create' && event.message) {
          const incoming = event.message;
          const id = String(incoming.id || `msg_${Date.now()}`).slice(0, 128);

          // Idempotency guard: check if message already exists
          if (serverMessages.some((m) => m.id === id)) {
            return;
          }

          const validatedMessage: ServerChatMessage = {
            id,
            roomId: String(incoming.roomId || '').slice(0, 128),
            senderId: String(incoming.senderId || '').slice(0, 128),
            senderHandle: String(incoming.senderHandle || 'naturalista').slice(0, 40),
            senderName: String(incoming.senderName || 'Coleccionista').slice(0, 80),
            recipientId: String(incoming.recipientId || '').slice(0, 128),
            text: String(incoming.text || '').trim().slice(0, 500),
            timestamp: incoming.timestamp || new Date().toISOString(),
          };

          if (!validatedMessage.text || !validatedMessage.roomId) return;

          serverMessages.push(validatedMessage);
          if (serverMessages.length > 500) {
            serverMessages.shift();
          }

          broadcastEvent({
            type: 'message:created',
            message: validatedMessage,
          });
        }
      } catch {
        // Ignore malformed socket frames
      }
    });

    ws.on('close', () => {
      clientPresence.delete(ws);
      broadcastPresence();
    });
  });

  // REST Fallback for chat messages (useful when WebSocket upgrade is blocked by external proxies)
  app.get('/api/messages', (_req, res) => {
    res.json({ messages: serverMessages.slice(-200) });
  });

  app.post('/api/messages', (req, res) => {
    const incoming = req.body;
    if (!incoming || !incoming.text || !incoming.roomId) {
      return res.status(400).json({ error: 'Mensaje inválido' });
    }
    const id = String(incoming.id || `msg_${Date.now()}`).slice(0, 128);
    const existing = serverMessages.find((m) => m.id === id);
    if (existing) {
      return res.json({ message: existing });
    }
    const validatedMessage: ServerChatMessage = {
      id,
      roomId: String(incoming.roomId).slice(0, 128),
      senderId: String(incoming.senderId || '').slice(0, 128),
      senderHandle: String(incoming.senderHandle || 'naturalista').slice(0, 40),
      senderName: String(incoming.senderName || 'Coleccionista').slice(0, 80),
      recipientId: String(incoming.recipientId || '').slice(0, 128),
      text: String(incoming.text).trim().slice(0, 500),
      timestamp: incoming.timestamp || new Date().toISOString(),
    };
    serverMessages.push(validatedMessage);
    broadcastEvent({
      type: 'message:created',
      message: validatedMessage,
    });
    return res.json({ message: validatedMessage });
  });

  // Server-side Gemini AI Species Identifier (PlantNet & Wildlife)
  app.post('/api/identify', async (req, res) => {
    try {
      const { imageBase64, mimeType, categoryHint } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Se requiere una imagen para identificar.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const validMime = mimeType || 'image/jpeg';

      const prompt = `Eres un experto taxónomo botánico y zoólogo de campo (estilo PlantNet e iNaturalist).
Analiza esta fotografía de un hallazgo natural (${categoryHint ? `pista de categoría: ${categoryHint}` : 'planta, animal o hongo'}) e identifica la especie con precisión científica.
Devuelve los datos en español (excepto el nombre científico y familia en latín estándar).
Si la imagen no muestra claramente un ser vivo, indica la aproximación taxonómica más cercana posible y ajusta la confianza.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: validMime,
                data: rawBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scientificName: {
                type: Type.STRING,
                description: 'Nombre científico binomial en latín (ej. Lophophora williamsii, Monstera deliciosa)',
              },
              commonName: {
                type: Type.STRING,
                description: 'Nombre común principal en español (ej. Peyote, Costilla de Adán)',
              },
              category: {
                type: Type.STRING,
                description: 'Uno de: plant, animal, fungi',
              },
              family: {
                type: Type.STRING,
                description: 'Familia taxonómica en latín (ej. Cactaceae, Araceae)',
              },
              kingdom: {
                type: Type.STRING,
                description: 'Reino taxonómico (Plantae, Animalia, Fungi)',
              },
              confidence: {
                type: Type.INTEGER,
                description: 'Porcentaje de certeza estimado de 1 a 99',
              },
              conservationStatus: {
                type: Type.STRING,
                description: 'Estado de conservación IUCN breve (ej. Vulnerable (VU), Preocupación menor (LC))',
              },
              habitat: {
                type: Type.STRING,
                description: 'Hábitat natural resumido en máximo 80 caracteres',
              },
              description: {
                type: Type.STRING,
                description: 'Nota botánica o zoológica concisa sobre rasgos morfológicos clave (máximo 240 caracteres)',
              },
              similarSpecies: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: 'Hasta 2 especies similares en formato Nombre científico (Nombre común)',
              },
            },
            required: [
              'scientificName',
              'commonName',
              'category',
              'family',
              'kingdom',
              'conservationStatus',
              'habitat',
              'description',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: 'No se recibió respuesta del identificador.' });
      }

      const parsed = JSON.parse(text.trim());
      return res.json(parsed);
    } catch (error) {
      console.error('Error en /api/identify:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al identificar el espécimen.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Biofolio server + WebSocket chat running on http://localhost:${PORT}`);
  });
}

startServer();
