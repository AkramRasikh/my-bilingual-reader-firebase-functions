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
    return false;
  }

  const cleanedArray = filterOutNestedNulls(wordSnapShotArr);
  await db.ref(refPath).set([...cleanedArray, word]);
  return word;
};

export const addImprovWordRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, addImprovWordValidation);
  if (!isValid) {
    return;
  }

  const { language, inquiry, context, reviewData } = req.body;

  try {
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
      res.status(409).json({ error: 'Word already exists' });
      return;
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
      reviewData: reviewData || getInitVocabCard(),
      ...(parsed.word.notes ? { notes: parsed.word.notes } : {}),
    };

    const savedWord = await persistImprovWord({
      language,
      word: wordToSave,
    });

    if (!savedWord) {
      res.status(409).json({ error: 'Word already exists' });
      return;
    }

    res.status(200).json({
      word: savedWord,
      sentence: sentenceToSave,
    });
  } catch (error: any) {
    console.log('## /add-improv-word error', error);
    res.status(500).json({
      error: error?.message || `Error adding improv word in ${language}`,
    });
  }
};
