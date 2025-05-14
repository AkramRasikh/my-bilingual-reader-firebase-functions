import OpenAI from 'openai';
import { chinese, japanese, LanguageTypes } from '../language-keys';
import { japaneseformatTranslationPrompt } from './japanese-word-prompt';
import { chineseformatTranslationPrompt } from './chinese-word-prompt';
import config from '../config';

interface chatGPTTranslatorParams {
  word: string;
  language: LanguageTypes;
  context?: string;
}

interface GetThisLanguagePromptTypes {
  word: string;
  language: LanguageTypes;
  context: string;
}

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

export const chatGPTTranslator = async ({
  word,
  context,
  language,
}: chatGPTTranslatorParams) => {
  const deepseekKey = config.deepSeekKey;
  const openai = new OpenAI({
    apiKey: deepseekKey,
    baseURL: 'https://api.deepseek.com/v1',
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
    const message = error?.message;
    const tooManyRequestsOrVerifyIssues =
      message?.includes('quota') || message?.includes('Quota');
    if (tooManyRequestsOrVerifyIssues) {
      throw new Error('Open AI quota error');
    }
    throw new Error('Error using OpenAI translation');
  }
};
