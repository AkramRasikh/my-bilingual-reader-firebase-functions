import { completeChatWithFallback } from '../ai-utils';

const japaneseKanjiToPhoenticPrompt = ({ word, context = '' }) => {
  const contextInstruction = context
    ? `The word appears in this context: "${context}". `
    : '';

  return `You are a language assistant. Given a word in Japanese, return the correct phonetic reading (e.g., Hiragana for Japanese or Pinyin for Chinese) as a single plain string. ${contextInstruction}Only return the phonetic representation. No explanations. The word is: ${word}`;
};

export const deepSeekKanjiToPhonetic = async ({ word, context }: any) => {
  const formattedTranslationPrompt = japaneseKanjiToPhoenticPrompt({
    word,
    context,
  });

  try {
    const content = await completeChatWithFallback({
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates natural and fluent Japanese sentences based on English instructions.',
        },
        {
          role: 'user',
          content: formattedTranslationPrompt,
        },
      ],
    });
    return content.trim();
  } catch (error) {
    console.error('Deepseek Status Code:', error.response?.status);
    console.error('Deepseek Error:', error.message);
    if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Error calling DeepSeek API');
    }
  }
};
