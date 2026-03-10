import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

let groq: Groq | null = null;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

const FILE_CREATION_INSTRUCTION = `
If the user asks you to create, write, draft, or generate a document or file, include it in your response using this exact format (replace filename and content):
<FILE name="filename.txt">
file content here
</FILE>
You can use .txt, .md, or .csv extensions. Only include one FILE block per response. Write your conversational reply before the FILE block.`;

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  tom: `You are Tom, an AI data scientist agent. You are analytical, precise, and concise.
You specialize in data analysis, statistics, and machine learning.
Respond in the same language as the user (Korean if they write Korean, English if English).
NEVER use Japanese characters (hiragana, katakana) or Chinese characters (kanji/hanzi). Use only Korean (Hangul), Latin alphabet, and numbers.
Keep responses brief and practical. Use bullet points when listing multiple items.${FILE_CREATION_INSTRUCTION}`,

  grace: `You are Grace, an AI research agent. You are thorough, curious, and well-read.
You specialize in literature reviews, finding information, and synthesizing knowledge.
Respond in the same language as the user (Korean if they write Korean, English if English).
NEVER use Japanese characters (hiragana, katakana) or Chinese characters (kanji/hanzi). Use only Korean (Hangul), Latin alphabet, and numbers.
Be helpful and informative but not overly verbose.${FILE_CREATION_INSTRUCTION}`,

  max: `You are Max, an AI agent who is always busy working on tasks.
You are energetic, quick to respond, and sometimes mention what you're currently working on.
Respond in the same language as the user (Korean if they write Korean, English if English).
NEVER use Japanese characters (hiragana, katakana) or Chinese characters (kanji/hanzi). Use only Korean (Hangul), Latin alphabet, and numbers.
Be friendly and proactive. Keep responses concise.${FILE_CREATION_INSTRUCTION}`,
};

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI agent collaborating with the team.
Respond in the same language as the user (Korean if they write Korean, English if English).
NEVER use Japanese characters (hiragana, katakana) or Chinese characters (kanji/hanzi). Use only Korean (Hangul), Latin alphabet, and numbers.
Be concise and helpful.${FILE_CREATION_INSTRUCTION}`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, agentId, agentName, workingTask } = await req.json() as {
      messages: ChatMessage[];
      agentId: string;
      agentName: string;
      workingTask?: string;
    };

    const key = agentId.toLowerCase();
    let systemPrompt = AGENT_SYSTEM_PROMPTS[key] ?? DEFAULT_SYSTEM_PROMPT;

    if (workingTask && key === 'max') {
      systemPrompt += `\nYou are currently working on: "${workingTask}". Occasionally mention it briefly.`;
    }

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    let content = completion.choices[0]?.message?.content ?? `(${agentName} responded)`;

    // Extract <FILE name="...">...</FILE> block if present
    const fileMatch = content.match(/<FILE\s+name="([^"]+)">([\s\S]*?)<\/FILE>/);
    let generatedFile: { name: string; content: string } | undefined;
    if (fileMatch) {
      generatedFile = { name: fileMatch[1].trim(), content: fileMatch[2].trim() };
      content = content.replace(/<FILE\s+name="[^"]+">([\s\S]*?)<\/FILE>/, '').trim();
    }

    return NextResponse.json({ content, generatedFile });
  } catch (err) {
    console.error('[chat API]', err);
    return NextResponse.json({ error: 'AI 응답 실패' }, { status: 500 });
  }
}
