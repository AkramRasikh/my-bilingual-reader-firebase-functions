import OpenAI from 'openai';
import config from '../config';

const baseURL = 'https://api.deepseek.com/v1';

const japaneseKanjiToPhoenticPrompt = ({ word, context = '' }) => {
  const contextInstruction = context
    ? `The word appears in this context: "${context}". `
    : '';

  return `You are a language assistant. Given a word in Japanese, return the correct phonetic reading (e.g., Hiragana for Japanese or Pinyin for Chinese) as a single plain string. ${contextInstruction}Only return the phonetic representation. No explanations. The word is: ${word}`;
};

export const deepSeekKanjiToPhonetic = async ({ word, context }: any) => {
  const deepseekKey = config.deepSeekKey;
  const openai = new OpenAI({
    apiKey: deepseekKey,
    baseURL,
  });

  const formattedTranslationPrompt = japaneseKanjiToPhoenticPrompt({
    word,
    context,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: formattedTranslationPrompt,
        },
      ],
      model: 'deepseek-chat',
    });

    const content = completion.choices[0].message.content;
    return content.trim();
  } catch (error) {
    console.error('Deepseek Status Code:', error.response.status);
    console.error('Deepseek Error:', error.message);
    if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Error calling DeepSeek API');
    }
  }
};
