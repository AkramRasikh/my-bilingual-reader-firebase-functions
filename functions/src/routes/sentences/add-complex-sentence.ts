import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { deepSeekChatAPI } from '../../ai-utils';
import { db } from '../../db';
import { saveSentenceToContent } from '../../firebase-utils/add-sentence';
import { LanguageTypes } from '../../language-keys';
import { routeValidator } from '../../shared-validation/route-validator';
import { getInitSentenceCard } from '../../srs-utils';
import { synthesizeSpeech } from '../text-to-speech';
import { addComplexSentenceValidation } from './add-complex-sentence-validation';
import {
  ComplexSentenceWord,
  buildComplexSentencePrompt,
} from './add-complex-sentence-prompt';
import {
  GrammarCategory,
  GrammarSetting,
} from './complex-sentence-grammar';

interface BreakdownVocab {
  surfaceForm?: string;
  meaning?: string;
  transliteration?: string;
}

const includesVocabTransliteration = (language: string) =>
  language.toLowerCase() !== 'french';

interface ComplexSentenceAiResult {
  targetLang?: string;
  baseLang?: string;
  transliteration?: string;
  notes?: string;
  vocab?: BreakdownVocab[];
  sentenceStructure?: string;
  meaning?: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const parseComplexSentenceResult = (
  result: ComplexSentenceAiResult,
  language = '',
) => {
  const targetLang = result?.targetLang?.trim();
  const baseLang = result?.baseLang?.trim();
  const transliteration = result?.transliteration?.trim();
  const withVocabTransliteration = includesVocabTransliteration(language);

  const sentenceStructure = result?.sentenceStructure?.trim();
  const meaning = result?.meaning?.trim();
  const vocab = Array.isArray(result?.vocab)
    ? result.vocab
        .map((item) => {
          const entry: {
            surfaceForm: string;
            meaning: string;
            transliteration?: string;
          } = {
            surfaceForm: item?.surfaceForm?.trim() ?? '',
            meaning: item?.meaning?.trim() ?? '',
          };
          if (withVocabTransliteration) {
            entry.transliteration = item?.transliteration?.trim() ?? '';
          }
          return entry;
        })
        .filter((item) => item.surfaceForm && item.meaning)
    : [];

  if (
    !targetLang ||
    !baseLang ||
    !transliteration ||
    !sentenceStructure ||
    !meaning ||
    vocab.length === 0 ||
    (withVocabTransliteration &&
      vocab.some((item) => !item.transliteration))
  ) {
    throw new Error(
      'Complex sentence result missing targetLang, baseLang, transliteration, vocab, sentenceStructure, meaning, or vocab transliteration',
    );
  }

  return {
    targetLang,
    baseLang,
    transliteration,
    notes: isNonEmptyString(result?.notes) ? result.notes.trim() : undefined,
    vocab,
    sentenceStructure,
    meaning,
  };
};

export const addComplexSentenceRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, addComplexSentenceValidation);
  if (!isValid) {
    return;
  }

  const language = req.body.language as LanguageTypes;
  const words = req.body.words as ComplexSentenceWord[];
  const config = req.body.config as
    | Partial<Record<GrammarCategory, GrammarSetting>>
    | undefined;
  const notes = req.body.notes as string | undefined;

  try {
    const prompt = buildComplexSentencePrompt({
      language,
      words,
      config,
      notes,
    });
    const resultContent = await deepSeekChatAPI({
      sentence: prompt,
      language,
    });
    const parsed = parseComplexSentenceResult(resultContent, language);
    const sentenceToSave = {
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      reviewData: getInitSentenceCard(),
      targetLang: parsed.targetLang,
      baseLang: parsed.baseLang,
      transliteration: parsed.transliteration,
      vocab: parsed.vocab,
      sentenceStructure: parsed.sentenceStructure,
      meaning: parsed.meaning,
      ...(parsed.notes ? { notes: parsed.notes } : {}),
      ...(isNonEmptyString(notes) ? { inquiry: notes.trim() } : {}),
    };

    await saveSentenceToContent({
      db,
      language,
      sentenceData: sentenceToSave,
    });

    await synthesizeSpeech({
      id: sentenceToSave.id,
      text: sentenceToSave.targetLang,
      language,
    });

    res.status(200).json(sentenceToSave);
  } catch (error: unknown) {
    console.log('## /add-complex-sentence error', error);
    const message =
      error instanceof Error ? error.message : 'Error adding complex sentence';
    res.status(500).json({ error: message });
  }
};
