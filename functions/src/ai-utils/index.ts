import OpenAI from 'openai';
import { chinese, japanese, LanguageTypes } from '../language-keys';
import { japaneseformatTranslationPrompt } from './japanese-word-prompt';
import { chineseformatTranslationPrompt } from './chinese-word-prompt';
import config from '../config';

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

const baseURL = 'https://api.deepseek.com/v1';

const getThisLanguagePrompt = ({
  word,
  language,
  context,
}: GetThisLanguagePromptTypes) => {
  if (language === japanese) {
    return japaneseformatTranslationPrompt(word, context);
  } else if (language === chinese) {
    return chineseformatTranslationPrompt(word, context);
  }
  throw new Error('Error matching language keys for prompt');
};

export const deepSeekChatAPI = async ({ sentence }) => {
  const deepseekKey = config.deepSeekKey;
  const openai = new OpenAI({
    apiKey: deepseekKey,
    baseURL,
  });
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: sentence,
        },
      ],
      model: 'deepseek-chat',
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
  const deepseekKey = config.deepSeekKey;
  const openai = new OpenAI({
    apiKey: deepseekKey,
    baseURL,
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
          role: 'user',
          content: formattedTranslationPrompt,
        },
      ],
      model: 'deepseek-chat',
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
