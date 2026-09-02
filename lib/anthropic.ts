import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type LLMProvider = 
  | "anthropic" 
  | "perplexity" 
  | "gemini" 
  | "openai" 
  | "deepseek" 
  | "groq";

export const LLM_PROVIDER = (process.env.LLM_PROVIDER as LLMProvider) || "gemini";

// ==================== CONFIG PROVIDERS ====================

const configs: Record<string, { client: OpenAI | Anthropic | null; model: string }> = {
  anthropic: {
    client: process.env.ANTHROPIC_API_KEY 
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) 
      : null,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
  },
  perplexity: {
    client: process.env.PERPLEXITY_API_KEY
      ? new OpenAI({ apiKey: process.env.PERPLEXITY_API_KEY, baseURL: "https://api.perplexity.ai" })
      : null,
    model: process.env.PERPLEXITY_MODEL || "sonar-pro",
  },
  gemini: {
    client: process.env.GEMINI_API_KEY
      ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" })
      : null,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-05-20",
  },
  openai: {
    client: process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  deepseek: {
    client: process.env.DEEPSEEK_API_KEY
      ? new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" })
      : null,
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  },
  groq: {
    client: process.env.GROQ_API_KEY
      ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })
      : null,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },
};

const active = configs[LLM_PROVIDER];
export const LLM_ENABLED = !!active?.client;
export const CURRENT_MODEL = active?.model ?? "unknown";

// ==================== TYPES ====================

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface LLMResponse {
  text: string;
  toolCalls: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
}

// ==================== UNIFIED CALL ====================

export async function callLLM(opts: {
  system?: string;
  messages: LLMMessage[];
  tools?: LLMTool[];
  maxTokens?: number;
}): Promise<LLMResponse> {
  // --- Anthropic (natif) ---
  if (LLM_PROVIDER === "anthropic" && active?.client instanceof Anthropic) {
    const response = await active.client.messages.create({
      model: CURRENT_MODEL,
      max_tokens: opts.maxTokens || 1536,
      system: opts.system || "",
      tools: opts.tools as any,
      messages: opts.messages as any,
    });

    const toolCalls = response.content
      .filter((b: any) => b.type === "tool_use")
      .map((b: any) => ({ id: b.id, name: b.name, input: b.input }));

    const text = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    return { text, toolCalls };
  }

  // --- OpenAI-compatible providers (Gemini, OpenAI, Perplexity, DeepSeek, Groq) ---
  if (active?.client instanceof OpenAI) {
    const openaiTools = opts.tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    const completion = await active.client.chat.completions.create({
      model: CURRENT_MODEL,
      messages: [
        ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
        ...opts.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
      tools: openaiTools,
      tool_choice: openaiTools ? "auto" : undefined,
      max_tokens: opts.maxTokens || 1536,
    });

    const msg = completion.choices[0].message;
    const toolCalls =
      msg.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
      })) || [];

    return { text: msg.content || "", toolCalls };
  }

  throw new Error(`Provider ${LLM_PROVIDER} non configuré. Vérifie ta clé API.`);
}