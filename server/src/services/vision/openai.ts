import OpenAI from 'openai';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';
import { SYSTEM_PROMPT } from 'shared';
import type { VisionClient, VisionRequest, VisionResponse, StreamCallback } from './client.js';

/**
 * OpenAI GPT-4o Vision client.
 */
export class OpenAIVisionClient implements VisionClient {
  private client: OpenAI | null = null;

  constructor() {
    if (config.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    }
  }

  private getClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }
    return this.client;
  }

  async analyze(request: VisionRequest): Promise<VisionResponse> {
    const openai = this.getClient();

    const messages = this.buildMessages(request);

    const response = await openai.chat.completions.create({
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens || 512,
    });

    const usage = response.usage;
    return {
      text: response.choices[0]?.message?.content || '',
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
    };
  }

  async analyzeStream(request: VisionRequest, onChunk: StreamCallback): Promise<VisionResponse> {
    const openai = this.getClient();

    const messages = this.buildMessages(request);

    const stream = await openai.chat.completions.create({
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens || 512,
      stream: true,
    });

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens || 0;
        outputTokens = chunk.usage.completion_tokens || 0;
      }
    }

    return { text: fullText, inputTokens, outputTokens };
  }

  private buildMessages(request: VisionRequest): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const systemPrompt = request.systemPrompt || SYSTEM_PROMPT;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Build conversation from history
    for (const msg of request.messages) {
      if (msg.role === 'system') continue;

      if (msg.role === 'user' && msg.frame) {
        // Multimodal user message with image
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: msg.text },
            {
              type: 'image_url',
              image_url: {
                url: `data:${msg.frame.mimeType};base64,${msg.frame.data}`,
                detail: 'low', // Use low detail to save tokens
              },
            },
          ],
        });
      } else if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }

    // Add current frame if provided and not already in last message
    if (request.frameBase64) {
      const lastMsg = messages[messages.length - 1];
      const currentText = request.messages[request.messages.length - 1]?.text || 'Describe what you see.';

      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: currentText },
          {
            type: 'image_url',
            image_url: {
              url: `data:${request.frameMimeType || 'image/jpeg'};base64,${request.frameBase64}`,
              detail: 'low',
            },
          },
        ],
      });
    }

    return messages;
  }
}
