import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import {
  adhocSentenceMinimalPairingWordsMeaningPrompt,
  adhocSentenceMinimalPairingWordsPrompt,
  chineseCharacterSeperatePrompt,
  customWordPrompt,
  grammarContrastPrompt,
  howToExpressPrompt,
  howToSayPrompt,
  visualCharacterPairingPrompt,
} from './add-sentence-prompt';
import { getInitSentenceCard } from '../../srs-utils';
import { deepSeekChatAPI } from '../../ai-utils';
import { updateWordContext } from '../../firebase-utils/update-word-context';
import { addSentencesBulk } from '../../firebase-utils/add-sentences-bulk';
import { synthesizeSpeech } from '../text-to-speech';

const adhocSentenceTTSRoute = async (req: Request, res: Response) => {
  const language = req.body.language;
  const sentence = req.body.sentence;
  const context = req.body?.context;
  const includeVariations = req.body?.includeVariations;
  const sentencePrompt = howToSayPrompt({
    sentence,
    targetLanguage: language,
    context,
    includeVariations,
  });

  try {
    const resultContent = await deepSeekChatAPI({
      sentence: sentencePrompt,
    });

    const sentencesFromResult = resultContent.sentences;

    const sentencesWithIds = sentencesFromResult.map((sentenceData) => ({
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      baseLang: sentence,
      context,
      reviewData: getInitSentenceCard(),
      ...sentenceData,
    }));
    const sentencesToAddFromDB = await addSentencesBulk({
      language,
      sentencesBulk: sentencesWithIds,
    });

    await Promise.all(
      sentencesWithIds.map(async (item) => {
        const id = item.id;
        const text = item.targetLang;

        return await synthesizeSpeech({
          id,
          text,
          language,
        });
      }),
    );

    res.status(200).json(sentencesToAddFromDB);
  } catch (error) {
    console.log('## /adhoc-sentence-tts error', error);
    res.status(500).json({ error });
  }
};

const adhocExpressionTTS = async (req: Request, res: Response) => {
  const language = req.body.language;
  const inquiry = req.body.inquiry;
  const context = req.body?.context || '';
  const includeVariations = req.body?.includeVariations;
  const sentencePrompt = howToExpressPrompt({
    inquiry,
    targetLanguage: language,
    context,
    includeVariations,
  });

  try {
    const resultContent = await deepSeekChatAPI({
      sentence: sentencePrompt,
    });

    const sentencesFromResult = resultContent.sentences;

    const sentencesWithIds = sentencesFromResult.map((sentenceData) => ({
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      inquiry,
      context,
      reviewData: getInitSentenceCard(),
      ...sentenceData,
    }));
    const sentencesToAddFromDB = await addSentencesBulk({
      language,
      sentencesBulk: sentencesWithIds,
    });

    await Promise.all(
      sentencesWithIds.map(async (item) => {
        const id = item.id;
        const text = item.targetLang;

        return await synthesizeSpeech({
          id,
          text,
          language,
        });
      }),
    );

    res.status(200).json(sentencesToAddFromDB);
  } catch (error) {
    console.log('## /adhoc-expression-tts error', error);
    res.status(500).json({ error });
  }
};

const grammarContrastTTS = async (req: Request, res: Response) => {
  const language = req.body.language;
  const baseSentence = req.body.baseSentence;
  const context = req.body?.context || '';
  const grammarSection = req.body?.grammarSection;
  const includeVariations = req.body?.includeVariations;
  const isSubtleDiff = req.body?.isSubtleDiff;
  const sentencePrompt = grammarContrastPrompt({
    baseSentence,
    targetLanguage: language,
    context,
    includeVariations,
    grammarSection,
    isSubtleDiff,
  });

  try {
    const resultContent = await deepSeekChatAPI({
      sentence: sentencePrompt,
    });

    const sentencesFromResult = resultContent.sentences;

    const sentencesWithIds = sentencesFromResult.map((sentenceData) => ({
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      baseSentence,
      context,
      reviewData: getInitSentenceCard(),
      ...sentenceData,
    }));

    const sentencesToAddFromDB = await addSentencesBulk({
      language,
      sentencesBulk: sentencesWithIds,
    });

    await Promise.all(
      sentencesWithIds.map(async (item) => {
        const id = item.id;
        const text = item.targetLang;

        return await synthesizeSpeech({
          id,
          text,
          language,
        });
      }),
    );
    res.status(200).json(sentencesToAddFromDB);
  } catch (error) {
    console.log('## /grammar-contrast-tts error', error);
    res.status(500).json({ error });
  }
};

const adhocSentenceMinimalPairingRoute = async (
  req: Request,
  res: Response,
) => {
  const inputWord = req.body.inputWord;
  const language = req.body.language;
  const isMeaning = req.body.isMeaning; // antonym, synonym, functional, seperate, conversation (sort out placement)
  const isVisual = req.body.isVisual;

  try {
    const sentencePrompt = isVisual
      ? visualCharacterPairingPrompt({
          language,
          word: inputWord,
        })
      : isMeaning === 'seperate'
      ? chineseCharacterSeperatePrompt({
          language,
          word: inputWord,
        })
      : isMeaning
      ? adhocSentenceMinimalPairingWordsMeaningPrompt({
          targetLanguage: language,
          word: inputWord,
          pairingType: isMeaning,
        })
      : adhocSentenceMinimalPairingWordsPrompt({
          targetLanguage: language,
          word: inputWord,
        });
    const resultContent = await deepSeekChatAPI({
      sentence: sentencePrompt,
    });
    const sentencesFromResult = resultContent.sentences;

    const sentencesWithIds = sentencesFromResult.map((sentence) => ({
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      ...sentence,
      reviewData: getInitSentenceCard(),
    }));

    const sentencesToAddFromDB = await addSentencesBulk({
      language,
      sentencesBulk: sentencesWithIds,
    });

    await Promise.all(
      sentencesWithIds.map(async (item) => {
        const id = item.id;
        const text = item.targetLang;

        return await synthesizeSpeech({
          id,
          text,
          language,
        });
      }),
    );

    await Promise.all(
      sentencesToAddFromDB.map(async (sentence) => {
        const sentenceId = sentence.id;
        return await updateWordContext({
          wordId: inputWord.id,
          sentenceId,
          language,
        });
      }),
    );
    res.status(200).json(sentencesToAddFromDB);
  } catch (error) {
    console.log('## /minimal-pair-sound error', error);
    res.status(500).json({ error });
  }
};
const adhocSentenceCustomWord = async (req: Request, res: Response) => {
  const inputWord = req.body.inputWord;
  const language = req.body.language;
  const prompt = req.body.prompt;

  try {
    const sentencePrompt = customWordPrompt({
      language,
      word: inputWord,
      prompt,
    });

    const resultContent = await deepSeekChatAPI({
      sentence: sentencePrompt,
    });
    const sentencesFromResult = resultContent.sentences;

    const sentencesWithIds = sentencesFromResult.map((sentence) => ({
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      ...sentence,
      reviewData: getInitSentenceCard(),
    }));

    const sentencesToAddFromDB = await addSentencesBulk({
      language,
      sentencesBulk: sentencesWithIds,
    });

    await Promise.all(
      sentencesWithIds.map(async (item) => {
        const id = item.id;
        const text = item.targetLang;

        return await synthesizeSpeech({
          id,
          text,
          language,
        });
      }),
    );

    await Promise.all(
      sentencesToAddFromDB.map(async (sentence) => {
        const sentenceId = sentence.id;
        return await updateWordContext({
          wordId: inputWord.id,
          sentenceId,
          language,
        });
      }),
    );
    res.status(200).json(sentencesToAddFromDB);
  } catch (error) {
    console.log('## /custom-word-prompt error', error);
    res.status(500).json({ error });
  }
};

export {
  adhocSentenceTTSRoute,
  adhocSentenceMinimalPairingRoute,
  adhocExpressionTTS,
  grammarContrastTTS,
  adhocSentenceCustomWord,
};
