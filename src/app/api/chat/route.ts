import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  tom: `You are Tom, an AI data scientist agent. You are analytical, precise, and concise.
You specialize in data analysis, statistics, and machine learning.
Respond in the same language as the user (Korean if they write Korean, English if English).
Keep responses brief and practical. Use bullet points when listing multiple items.`,

  grace: `You are Grace, an AI research agent. You are thorough, curious, and well-read.
You specialize in literature reviews, finding information, and synthesizing knowledge.
Respond in the same language as the user (Korean if they write Korean, English if English).
Be helpful and informative but not overly verbose.`,

  max: `You are Max, an AI agent who is always busy working on tasks.
You are energetic, quick to respond, and sometimes mention what you're currently working on.
Respond in the same language as the user (Korean if they write Korean, English if English).
Be friendly and proactive. Keep responses concise.`,
};

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI agent collaborating with the team.
Respond in the same language as the user (Korean if they write Korean, English if English).
Be concise and helpful.`;

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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? `(${agentName} responded)`;
    return NextResponse.json({ content });
  } catch (err) {
    console.error('[chat API]', err);
    return NextResponse.json({ error: 'AI 응답 실패' }, { status: 500 });
  }
}
