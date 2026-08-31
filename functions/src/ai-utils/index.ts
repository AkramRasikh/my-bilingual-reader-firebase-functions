import OpenAI from 'openai';
import {
  arabic,
  chinese,
  french,
  japanese,
  LanguageTypes,
} from '../language-keys';
import { japaneseformatTranslationPrompt } from './japanese-word-prompt';
import { chineseformatTranslationPrompt } from './chinese-word-prompt';
import config from '../config';
import { arabicformatTranslationPrompt } from './arabic-word-prompt';
import { frenchFormatTranslationPrompt } from './french-word-prompt';

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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const deepSeekBaseUrl = 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';
const OPENAI_FALLBACK_MODEL = 'gpt-4o-mini';

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
  } else if (language === french) {
    return frenchFormatTranslationPrompt(word, context);
  } else {
    throw new Error('Error matching language keys for prompt');
  }
};

const parseJsonContent = (content: string) => {
  const cleanedContent = content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleanedContent);
};

const createDeepSeekClient = () =>
  new OpenAI({
    apiKey: config.deepSeekKey,
    baseURL: deepSeekBaseUrl,
  });

const createOpenAiClient = () =>
  new OpenAI({
    apiKey: config.openAiKey,
  });

const extractContent = (
  completion: OpenAI.Chat.ChatCompletion,
): string => {
  const content = completion.choices[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('Empty model content');
  }
  return content;
};

const messagesForJsonMode = (messages: ChatMessage[]): ChatMessage[] => {
  const alreadyMentionsJson = messages.some((message) =>
    /json/i.test(message.content),
  );
  if (alreadyMentionsJson) {
    return messages;
  }

  const [first, ...rest] = messages;
  if (first?.role === 'system') {
    return [
      {
        ...first,
        content: `${first.content} Return a JSON object.`,
      },
      ...rest,
    ];
  }

  return [{ role: 'system', content: 'Return a JSON object.' }, ...messages];
};

const callDeepSeek = async ({
  messages,
  json,
}: {
  messages: ChatMessage[];
  json?: boolean;
}) => {
  const client = createDeepSeekClient();
  const completion = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages,
    stream: false,
    ...(json ? { response_format: { type: 'json_object' as const } } : {}),
    thinking: { type: 'disabled' },
  } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
  return extractContent(completion);
};

const callOpenAiFallback = async ({
  messages,
  json,
}: {
  messages: ChatMessage[];
  json?: boolean;
}) => {
  const client = createOpenAiClient();
  const completion = await client.chat.completions.create({
    model: OPENAI_FALLBACK_MODEL,
    messages,
    ...(json ? { response_format: { type: 'json_object' as const } } : {}),
  });
  return extractContent(completion);
};

export const completeChatWithFallback = async ({
  messages,
  json,
}: {
  messages: ChatMessage[];
  json?: boolean;
}) => {
  const requestMessages = json ? messagesForJsonMode(messages) : messages;
  try {
    const content = await callDeepSeek({ messages: requestMessages, json });
    if (json) {
      parseJsonContent(content);
    }
    return content;
  } catch (error) {
    console.log('## DeepSeek failed, falling back to gpt-4o-mini', error);
    return callOpenAiFallback({ messages: requestMessages, json });
  }
};

export const deepSeekChatAPI = async ({ sentence, language }) => {
  try {
    const content = await completeChatWithFallback({
      json: true,
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
    });
    return parseJsonContent(content);
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
  const formattedTranslationPrompt = getThisLanguagePrompt({
    word,
    context,
    language,
  });

  try {
    const content = await completeChatWithFallback({
      json: true,
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
    });
    return parseJsonContent(content);
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
