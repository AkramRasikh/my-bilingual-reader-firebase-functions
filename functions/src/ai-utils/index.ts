import OpenAI from 'openai';
import { arabic, chinese, japanese, LanguageTypes } from '../language-keys';
import { japaneseformatTranslationPrompt } from './japanese-word-prompt';
import { chineseformatTranslationPrompt } from './chinese-word-prompt';
import config from '../config';
import { arabicformatTranslationPrompt } from './arabic-word-prompt';

interface deepSeekTranslatorParams {
  word: string;
  language: LanguageTypes;
  context?: string;
}

interface GetThisLanguagePromptTypes {
  word: string;
  language: LanguageTypes;
  context: string;
}

const deepSeekBaseUrl = 'https://api.deepseek.com/v1';

const getThisLanguagePrompt = ({
  word,
  language,
  context,
}: GetThisLanguagePromptTypes) => {
  if (language === japanese) {
    return japaneseformatTranslationPrompt(word, context);
  } else if (language === chinese) {
    return chineseformatTranslationPrompt(word, context);
  } else if (language === arabic) {
    return arabicformatTranslationPrompt(word, context);
  }
  throw new Error('Error matching language keys for prompt');
};

export const deepSeekChatAPI = async ({ sentence, language }) => {
  const openAiKey = config.openAiKey;
  const deepseekKey = config.deepSeekKey;
  const isChinese = language === chinese;
  const openai = new OpenAI({
    apiKey: isChinese ? deepseekKey : openAiKey,
    baseURL: isChinese ? deepSeekBaseUrl : undefined,
  });
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates natural and fluent ${language} sentences based on English instructions.`,
        },
        {
          role: 'user',
          content: sentence,
        },
      ],
      model: isChinese ? 'deepseek-chat' : 'gpt-4o-mini',
    });

    const content = completion.choices[0].message.content;
    const cleanedContent = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedContent);

    return parsed;
  } catch (error) {
    console.log('## Error DeepSeek: ', error);
    throw error;
  }
};

export const deepSeekTranslator = async ({
  word,
  context,
  language,
}: deepSeekTranslatorParams) => {
  const openAiKey = config.openAiKey;
  const deepseekKey = config.deepSeekKey;
  const isChinese = language === chinese;
  const openai = new OpenAI({
    apiKey: isChinese ? deepseekKey : openAiKey,
    baseURL: isChinese ? deepSeekBaseUrl : undefined,
  });

  const formattedTranslationPrompt = getThisLanguagePrompt({
    word,
    context,
    language,
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates natural and fluent ${language} sentences based on English instructions.`,
        },
        {
          role: 'user',
          content: formattedTranslationPrompt,
        },
      ],
      model: isChinese ? 'deepseek-chat' : 'gpt-4o-mini',
    });

    const content = completion.choices[0].message.content;
    const cleanedContent = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedContent);
    return parsed;
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
