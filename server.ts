/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Initialize Gemini API if key is available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini AI successfully initialized server-side.');
  } catch (err) {
    console.error('Failed to initialize Gemini client:', err);
  }
} else {
  console.log('No valid GEMINI_API_KEY found in environment. Using smart local recommendations fallback.');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Endpoints go here first
  app.post('/api/ai/recommend', async (req: express.Request, res: express.Response) => {
    const { prompt, currentMovie, watchHistoryTitles, language = 'pt-BR' } = req.body;

    const sysInstructions: Record<string, string> = {
      'pt-BR': `Você é o Curador de Cinema IA do CineNeo, uma plataforma de streaming premium.
Responda de forma extremamente amigável, elegante e concisa em Português do Brasil.
Apenas use formatação markdown elegante (negrito, listas). Indique recomendações de filmes ou séries que se encaixem no pedido do usuário.
Se o usuário estiver visualizando um filme agora: "${currentMovie ? JSON.stringify(currentMovie) : 'Nenhum'}".
Histórico de títulos assistidos pelo usuário: "${watchHistoryTitles ? watchHistoryTitles.join(', ') : 'Nenhum'}".
Dê dicas incríveis de filmes e mostre que você conhece o catálogo CineNeo (por exemplo: Cosmos Laundromat, Sintel, Tears of Steel, Subaru Race Dream, Big Buck Bunny, Elephants Dream, Caminhos da Natureza)!`,
      'pt-PT': `Você é o Curador de Cinema IA do CineNeo, uma plataforma de streaming premium.
Responda de forma extremamente amigável, elegante e concisa em Português de Portugal.
Utilize formatação markdown elegante (negrito, listas). Indique recomendações de filmes ou séries adequadas ao pedido.
Se o utilizador estiver a visualizar um filme: "${currentMovie ? JSON.stringify(currentMovie) : 'Nenhum'}".
Histórico de títulos vistos: "${watchHistoryTitles ? watchHistoryTitles.join(', ') : 'Nenhum'}".
Dê dicas incríveis de filmes e mostre que conhece o catálogo CineNeo (por exemplo: Cosmos Laundromat, Sintel, Tears of Steel, Subaru Race Dream, Big Buck Bunny, Elephants Dream, Caminhos da Natureza)!`,
      'en': `You are the CineNeo AI Movie Curator, a premium streaming platform AI guide.
Respond in an extremely friendly, elegant, and concise manner in English.
Only use elegant markdown formatting (bold, bullet points). Recommend titles that fit the user request.
Current movie the user is looking at: "${currentMovie ? JSON.stringify(currentMovie) : 'None'}".
User's watched history: "${watchHistoryTitles ? watchHistoryTitles.join(', ') : 'None'}".
Give awesome recommendations and show that you are familiar with CineNeo's library (e.g. Cosmos Laundromat, Sintel, Tears of Steel, Subaru Race Dream, Big Buck Bunny, Elephants Dream, Caminhos da Natureza)!`,
      'es': `Eres el Curador de Cine IA de CineNeo, una plataforma de streaming premium.
Responde de una manera extremadamente amigable, elegante y concisa en Español.
Usa formato markdown elegante (negrita, listas). Sugiere películas o series que se adapten al pedido.
Película actual: "${currentMovie ? JSON.stringify(currentMovie) : 'Ninguna'}".
Historial de visualización: "${watchHistoryTitles ? watchHistoryTitles.join(', ') : 'Ninguno'}".
¡Da recomendaciones fantásticas y demuestra que conoces el catálogo de CineNeo (por ejemplo: Cosmos Laundromat, Sintel, Tears of Steel, Subaru Race Dream, Big Buck Bunny, Elephants Dream, Caminhos da Natureza)!`,
      'zh': `您是 CineNeo 智能电影推荐官，CineNeo 是一家高端流媒体播放平台。
请使用中文，以极其友善、优雅且精炼的语气进行回复。
使用优雅的 Markdown 格式（加粗、列表）。推荐符合用户需求的内容。
当前浏览的影片: "${currentMovie ? JSON.stringify(currentMovie) : '无'}".
用户的观看历史: "${watchHistoryTitles ? watchHistoryTitles.join(', ') : '无'}".
推荐精彩的影片，并展现你非常熟悉 CineNeo 的片库（例如：Cosmos Laundromat, Sintel, Tears of Steel, Subaru Race Dream, Big Buck Bunny, Elephants Dream, Caminhos da Natureza）！`
    };

    const sysInstruction = sysInstructions[language] || sysInstructions['en'];

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt || 'Recomende algo especial para mim hoje!',
          config: {
            systemInstruction: sysInstruction,
            temperature: 0.8,
          },
        });

        const text = response.text || '';
        res.json({ success: true, text: text.trim() });
        return;
      } catch (err: any) {
        console.error('Gemini execution error, reverting to local recommendation fallback:', err);
      }
    }

    // Local Mock Fallback Recommendations if Gemini is not set up or fails
    const mockResponses: Record<string, string> = {
      'pt-BR': `**[Recomendação Local - IA Off-line]** Olá! Como a chave da API do Gemini não está configurada no momento, o Curador CineNeo preparou esta indicação especial para você baseada nos nossos maiores sucessos:

*   **Para quem ama Ficção Científica:** Nós recomendamos fortemente **Cosmos Laundromat** ou **Tears of Steel**, repletos de tecnologia visualmente espetacular.
*   **Para uma dose de fantasia emocionante:** Assista a **Sintel**, uma jornada épica de uma guerreira e seu dragão.
*   **Diversão em família:** **Big Buck Bunny** trará ótimas gargalhadas com as travessuras da floresta!

Espero que aproveite seu momento premium no CineNeo!`,
      'pt-PT': `**[Recomendação Local - IA Off-line]** Olá! Como a chave da API do Gemini não está configurada neste momento, o Curador CineNeo preparou esta indicação especial para si baseada nos nossos maiores êxitos:

*   **Para quem ama Ficção Científica:** Recomendamos fortemente **Cosmos Laundromat** ou **Tears of Steel**, repletos de tecnologia visualmente espetacular.
*   **Para uma dose de fantasia emocionante:** Assista a **Sintel**, uma jornada épica de uma guerreira e o seu dragão.
*   **Diversão em família:** **Big Buck Bunny** trará ótimas gargalhadas com as travessuras da floresta!

Espero que aproveite o seu momento premium no CineNeo!`,
      'en': `**[Local Recommendation - Offline AI]** Hello! Since the Gemini API key is not active right now, the CineNeo Curator prepared this special selection based on our catalog hits:

*   **For Sci-Fi Lovers:** We highly recommend **Cosmos Laundromat** or **Tears of Steel** with visually stunning futuristic technology.
*   **For Fantasy Enthusiasts:** Check out **Sintel**, an epic cinematic journey of a warrior girl and her baby dragon.
*   **Family Comedy:** **Big Buck Bunny** is packed with hilarious forest animal dynamics!

Enjoy your premium viewing experience on CineNeo!`,
      'es': `**[Recomendación Local - IA Offline]** ¡Hola! Dado que la clave de la API de Gemini no está activa ahora, el Curador de CineNeo preparó esta recomendación especial basada en nuestros éxitos:

*   **Para Amantes de la Ciencia Ficción:** Recomendamos ampliamente **Cosmos Laundromat** o **Tears of Steel** con impresionantes efectos visuales futuristas.
*   **Para Fans de la Fantasía:** No te pierdas **Sintel**, una aventura épica de una joven guerrera y su dragón.
*   **Comedia Familiar:** **Big Buck Bunny** es perfecta para reírse con las divertidas travesuras en el bosque.

¡Que disfrutes tu tiempo premium en CineNeo!`,
      'zh': `**[本地智能推荐 - 离线模式]** 您好！由于 Gemini 智能 API Key 尚未配置，CineNeo 电影推荐官根据我们的热门内容为您精心挑选了以下推荐：

*   **科幻大片首选：** 强烈推荐科幻视觉巨作 **Cosmos Laundromat**（宇宙洗衣店）和 **Tears of Steel**（钢铁之泪）。
*   **奇幻史诗冒险：** 别错过精彩暖心的 **Sintel**（辛特尔），看一位女战士与幼龙并肩作战。
*   **合家欢动画喜剧：** 推荐极具幽默感的 **Big Buck Bunny**（大雄兔），感受森林小动物的爆笑日常！

祝您在 CineNeo 享受尊贵的观影时光！`
    };

    const fallbackResponse = mockResponses[language] || mockResponses['en'];
    res.json({ success: true, text: fallbackResponse });
  });

  // Serve Vite / static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
