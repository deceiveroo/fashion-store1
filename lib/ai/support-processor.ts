import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { db } from '@/lib/db';
import { chatSessions, messages as messagesSchema } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

const SYSTEM_PROMPT = `Ты — помощник техподдержки интернет-магазина одежды "Fashion Store".
Правила:
1. Отвечай кратко, по делу, на русском языке.
2. Не выдумывай информацию: если нет данных в контексте — говори об этом.
3. Если вопрос касается: оплаты, возврата, личных данных, статуса заказа, доступа к аккаунту — сразу предлагай оператора.
4. В конце ответа добавь блок: \`\`\`json\n{"confidence": 1-5}\n\`\`\` где 1 = совсем не уверен, 5 = полностью уверен.
5. Если уверенность <= 2 — в тексте ответа напиши: "Передаю вопрос специалисту."`;

export async function processAIResponse(userMessage: string, sessionId: number) {
  // Load conversation history
  const history = await db.select({
    role: messagesSchema.role,
    content: messagesSchema.content
  })
  .from(messagesSchema)
  .where(eq(messagesSchema.sessionId, sessionId))
  .orderBy(desc(messagesSchema.createdAt))
  .limit(5);

  const historyText = history.reverse().map(msg => `${msg.role}: ${msg.content}`).join('\n');

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    prompt: `История диалога:\n${historyText || 'Нет истории'}\n\nПользователь: ${userMessage}`,
    temperature: 0.3,
    maxTokens: 500,
  });

  // Parse confidence from JSON block
  const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
  let confidence = 5;
  let cleanText = result.text;

  if (jsonMatch) {
    try {
      const meta = JSON.parse(jsonMatch[1]);
      confidence = typeof meta.confidence === 'number' ? Math.max(1, Math.min(5, meta.confidence)) : 5;
      cleanText = result.text.replace(jsonMatch[0], '').trim();
    } catch (e) {
      console.warn('Failed to parse confidence JSON', e);
    }
  }

  // Heuristics for lowering confidence
  if (
    /(не знаю|не уверен|не могу|извините|не нашёл|нет информации)/i.test(cleanText) ||
    cleanText.length < 10 ||
    /(оплата|возврат|заказ|аккаунт|пароль|личный кабинет)/i.test(userMessage)
  ) {
    confidence = Math.min(confidence, 2);
  }

  return {
    text: cleanText || result.text,
    confidence,
    fallback: confidence <= 2
  };
}