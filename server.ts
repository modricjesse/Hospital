import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Shared server-side Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Multi-turn Chat (gemini-3.5-flash, gemini-3.1-pro-preview, gemini-3.1-flash-lite)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.5-flash', systemInstruction } = req.body;
    
    // Validate model selection
    const allowedModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3.8-flash'];
    const chosenModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    // Format multi-turn history
    const contents = (messages || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || '' }],
    }));

    const defaultSystemInstruction = 
      'You are the DeHosp-Chain Communicable Disease & Epidemiological AI Advisor, an expert assistant for an online hospital integrating blockchain consensus and telemedicine. You provide clinical triage guidance for communicable illnesses (Lassa fever, Mpox, Cholera, Respiratory viruses), assist doctors in formulating diagnostic and quarantine protocols, and explain how tamper-proof smart contracts guarantee data integrity and public health reporting.';

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction: systemInstruction || defaultSystemInstruction,
      },
    });

    res.json({ reply: response.text || '' });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Error generating chat response' });
  }
});

// Endpoint: Audio Transcription (gemini-3.5-transcribe)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType,
          },
        },
        {
          text: 'Transcribe this spoken audio accurately. Output strictly the transcribed clinical/patient speech text with zero commentary or preamble.',
        },
      ],
    });

    res.json({ transcription: response.text || '' });
  } catch (error: any) {
    console.error('Transcription API Error:', error);
    res.status(500).json({ error: error.message || 'Error transcribing audio' });
  }
});

// WebSocket Server for Live Voice Conversations (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/ws/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice WebSocket');

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: 
          'You are the DeHosp-Chain Live Voice Clinical Assistant. You engage in real-time spoken conversations with patients and physicians regarding communicable disease symptoms, outbreak measures, isolation protocols, and decentralized telemedicine.',
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }
          if (text && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'text', text }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onerror: (err: any) => {
          console.error('Live API Session Error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: err.message || 'Live session error' }));
          }
        },
        onclose: () => {
          console.log('Live API Session closed');
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'audio' && payload.audio) {
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.type === 'text' && payload.text) {
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live Voice');
      if (session) {
        try {
          session.close();
        } catch (e) {}
      }
    });
  } catch (err: any) {
    console.error('Error establishing Live API connection:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`DeHosp-Chain server running on port ${port}`);
  });
}

startServer();
