import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { deepSeekChatAPI } from '../../ai-utils';
import { db } from '../../db';
import { addSentencesBulk } from '../../firebase-utils/add-sentences-bulk';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { LanguageTypes } from '../../language-keys';
import { wordsRef } from '../../refs';
import { routeValidator } from '../../shared-validation/route-validator';
import { getInitSentenceCard, getInitVocabCard } from '../../srs-utils';
import { filterOutNestedNulls } from '../../utils/filter-out-nested-nulls';
import { synthesizeSpeech } from '../text-to-speech';
import { WordType } from './add-word';
import { buildImprovWordPrompt } from './add-improv-word-prompt';
import { addImprovWordValidation } from './add-improv-word-validation';

interface ImprovAiWord {
  surfaceForm?: string;
  baseForm?: string;
  definition?: string;
  transliteration?: string;
  phonetic?: string;
  notes?: string;
}

interface ImprovAiSentence {
  targetLang?: string;
  baseLang?: string;
  notes?: string;
}

export interface ImprovAiResult {
  word?: ImprovAiWord;
  sentence?: ImprovAiSentence;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const parseImprovAiResult = (result: ImprovAiResult) => {
  const word = result?.word;
  const sentence = result?.sentence;
  const baseForm = word?.baseForm?.trim() || word?.surfaceForm?.trim();
  const surfaceForm = word?.surfaceForm?.trim() || word?.baseForm?.trim();
  const definition = word?.definition?.trim();
  const targetLang = sentence?.targetLang?.trim();
  const baseLang = sentence?.baseLang?.trim();

  if (!baseForm || !surfaceForm || !definition || !targetLang || !baseLang) {
    throw new Error(
      'Improv AI result missing word (baseForm/surfaceForm/definition) or sentence (targetLang/baseLang)',
    );
  }

  return {
    word: {
      baseForm,
      surfaceForm,
      definition,
      transliteration: word?.transliteration?.trim() || '',
      phonetic: word?.phonetic?.trim() || word?.transliteration?.trim() || '',
      notes: isNonEmptyString(word?.notes) ? word.notes.trim() : undefined,
    },
    sentence: {
      targetLang,
      baseLang,
      notes: isNonEmptyString(sentence?.notes)
        ? sentence.notes.trim()
        : undefined,
    },
  };
};

const isDuplicateWord = (existing: WordType[], word: Pick<WordType, 'baseForm' | 'surfaceForm'>) =>
  existing.some(
    (item) =>
      item?.baseForm === word.baseForm ||
      item?.surfaceForm === word.surfaceForm ||
      item?.baseForm === word.surfaceForm ||
      item?.surfaceForm === word.baseForm,
  );

class ImprovWordExistsError extends Error {
  constructor() {
    super('Word already exists');
  }
}

const persistImprovWord = async ({
  language,
  word,
}: {
  language: LanguageTypes;
  word: WordType;
}) => {
  const refPath = getRefPath({
    language,
    ref: wordsRef,
  });
  const wordSnapShotArr =
    (await getDataSnapshot({
      language,
      ref: wordsRef,
      db,
    })) || [];

  if (isDuplicateWord(wordSnapShotArr, word)) {
    throw new ImprovWordExistsError();
  }

  const cleanedArray = filterOutNestedNulls(wordSnapShotArr);
  await db.ref(refPath).set([...cleanedArray, word]);
  return word;
};

type ImprovInquiryResult = {
  word: WordType;
  sentence: {
    id: string;
    topic: string;
    hasAudio: boolean;
    inquiry: string;
    context?: string;
    reviewData: ReturnType<typeof getInitSentenceCard>;
    targetLang: string;
    baseLang: string;
    notes?: string;
  };
};

const addOneImprovInquiry = async ({
  language,
  inquiry,
  context,
  reviewData,
}: {
  language: LanguageTypes;
  inquiry: string;
  context?: string;
  reviewData?: WordType['reviewData'];
}): Promise<ImprovInquiryResult> => {
  const prompt = buildImprovWordPrompt({ inquiry, language, context });
  const resultContent = await deepSeekChatAPI({
    sentence: prompt,
    language,
  });
  const parsed = parseImprovAiResult(resultContent);

  const existingWords =
    (await getDataSnapshot({
      language,
      ref: wordsRef,
      db,
    })) || [];

  if (isDuplicateWord(existingWords, parsed.word)) {
    throw new ImprovWordExistsError();
  }

  const sentenceId = uuidv4();
  const wordId = uuidv4();

  const sentenceToSave = {
    id: sentenceId,
    topic: 'sentence-helper',
    hasAudio: true,
    inquiry,
    ...(isNonEmptyString(context) ? { context } : {}),
    reviewData: getInitSentenceCard(),
    targetLang: parsed.sentence.targetLang,
    baseLang: parsed.sentence.baseLang,
    ...(parsed.sentence.notes ? { notes: parsed.sentence.notes } : {}),
  };

  const sentencesSaved = await addSentencesBulk({
    language,
    sentencesBulk: [sentenceToSave],
  });

  if (!Array.isArray(sentencesSaved)) {
    throw new Error('Failed to save improv sentence');
  }

  await synthesizeSpeech({
    id: sentenceId,
    text: parsed.sentence.targetLang,
    language,
  });

  const wordToSave: WordType = {
    id: wordId,
    baseForm: parsed.word.baseForm,
    surfaceForm: parsed.word.surfaceForm,
    definition: parsed.word.definition,
    transliteration: parsed.word.transliteration,
    phonetic: parsed.word.phonetic,
    contexts: [sentenceId],
    reviewData: (reviewData || getInitVocabCard()) as WordType['reviewData'],
    ...(parsed.word.notes ? { notes: parsed.word.notes } : {}),
  };

  const savedWord = await persistImprovWord({
    language,
    word: wordToSave,
  });

  return {
    word: savedWord,
    sentence: sentenceToSave,
  };
};

const inquiryListFromBody = (body: {
  inquiry?: unknown;
  inquiries?: unknown;
}): { items: string[]; isBatch: boolean } | undefined => {
  if (Array.isArray(body.inquiries)) {
    const items = body.inquiries
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (items.length > 0) {
      return { items, isBatch: true };
    }
  }

  if (typeof body.inquiry === 'string' && body.inquiry.trim().length > 0) {
    return { items: [body.inquiry.trim()], isBatch: false };
  }

  return undefined;
};

const itemErrorMessage = (error: unknown, language: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return `Error adding improv word in ${language}`;
};

export const addImprovWordRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, addImprovWordValidation);
  if (!isValid) {
    return;
  }

  const { language, context, reviewData } = req.body;
  const inquiryList = inquiryListFromBody(req.body);
  if (!inquiryList) {
    res.status(400).json({
      error: 'Validation error passing inquiry for improv word',
    });
    return;
  }

  if (!inquiryList.isBatch) {
    try {
      const result = await addOneImprovInquiry({
        language,
        inquiry: inquiryList.items[0],
        context,
        reviewData,
      });
      res.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof ImprovWordExistsError) {
        res.status(409).json({ error: error.message });
        return;
      }
      console.log('## /add-improv-word error', error);
      res.status(500).json({
        error: itemErrorMessage(error, language),
      });
    }
    return;
  }

  const results = [];
  for (const inquiry of inquiryList.items) {
    try {
      results.push(
        await addOneImprovInquiry({
          language,
          inquiry,
          context,
          reviewData,
        }),
      );
    } catch (error: unknown) {
      console.log('## /add-improv-word item error', error);
      results.push({ error: itemErrorMessage(error, language) });
    }
  }

  res.status(200).json({ results });
};
