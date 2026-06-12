import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';
import { SYSTEM_PROMPT } from 'shared';
import type { VisionClient, VisionRequest, VisionResponse, StreamCallback } from './client.js';

/**
 * Anthropic Claude Vision client with prompt caching support.
 */
export class ClaudeVisionClient implements VisionClient {
  private client: Anthropic | null = null;

  constructor() {
    if (config.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    }
  }

  private getClient(): Anthropic {
    if (!this.client) {
      throw new Error('Anthropic API key not configured');
    }
    return this.client;
  }

  async analyze(request: VisionRequest): Promise<VisionResponse> {
    const anthropic = this.getClient();
    const { system, messages } = this.buildMessages(request);

    const response = await anthropic.messages.create({
      model: request.modelId,
      system,
      messages,
      max_tokens: request.maxTokens || 512,
    });

    const content = response.content[0];
    const text = content?.type === 'text' ? content.text : '';

    let inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const cacheHit = response.usage?.cache_read_input_tokens != null;
    const cachedInputTokens = response.usage?.cache_read_input_tokens || 0;

    // Remove cached tokens from input count for cost (cached are 90% cheaper)
    if (cacheHit) {
      inputTokens -= cachedInputTokens;
    }

    return {
      text,
      inputTokens,
      outputTokens,
      cacheHit,
      cachedInputTokens: cacheHit ? cachedInputTokens : undefined,
    };
  }

  async analyzeStream(request: VisionRequest, onChunk: StreamCallback): Promise<VisionResponse> {
    const anthropic = this.getClient();
    const { system, messages } = this.buildMessages(request);

    const stream = anthropic.messages.stream({
      model: request.modelId,
      system,
      messages,
      max_tokens: request.maxTokens || 512,
    });

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let cachedInputTokens = 0;
    let cacheHit = false;

    stream.on('text', (delta) => {
      fullText += delta;
      onChunk(delta);
    });

    const finalMessage = await stream.finalMessage();
    inputTokens = finalMessage.usage?.input_tokens || 0;
    outputTokens = finalMessage.usage?.output_tokens || 0;
    cachedInputTokens = finalMessage.usage?.cache_read_input_tokens || 0;
    cacheHit = cachedInputTokens > 0;

    if (cacheHit) {
      inputTokens -= cachedInputTokens;
    }

    return {
      text: fullText,
      inputTokens,
      outputTokens,
      cacheHit,
      cachedInputTokens: cacheHit ? cachedInputTokens : undefined,
    };
  }

  private buildMessages(request: VisionRequest): {
    system: Anthropic.TextBlockParam[];
    messages: Anthropic.MessageParam[];
  } {
    const systemPrompt = request.systemPrompt || SYSTEM_PROMPT;

    // Use prompt caching for system prompt (anthropic-specific cache_control)
    const system: Anthropic.TextBlockParam[] = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ];

    const messages: Anthropic.MessageParam[] = [];

    // Build conversation from history
    for (const msg of request.messages) {
      if (msg.role === 'system') continue;

      if (msg.role === 'user' && msg.frame) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: msg.frame.mimeType,
                data: msg.frame.data,
              },
            },
            { type: 'text', text: msg.text },
          ],
        });
      } else if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.text });
      }
    }

    // Add current frame if provided and not already handled
    if (request.frameBase64) {
      const lastMsg = messages[messages.length - 1];
      const currentText = request.messages[request.messages.length - 1]?.text || 'Describe what you see.';

      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (request.frameMimeType || 'image/jpeg') as 'image/jpeg',
              data: request.frameBase64,
            },
          },
          { type: 'text', text: currentText },
        ],
      });
    }

    return { system, messages };
  }
}
