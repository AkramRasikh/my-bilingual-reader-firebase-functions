import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { deepSeekChatAPI } from '../../ai-utils';
import { db } from '../../db';
import { saveSentenceToContent } from '../../firebase-utils/add-sentence';
import { updateWordContext } from '../../firebase-utils/update-word-context';
import { synthesizeSpeech } from '../text-to-speech';
import { buildMinimalSentencePrompt } from './add-minimal-sentence';

const adhocSentenceCustomWord = async (req: Request, res: Response) => {
  const inputWord = req.body.inputWord;
  const wordId = req.body.id;
  const language = req.body.language;
  const context = req.body.context;

  try {
    const sentencePrompt = buildMinimalSentencePrompt(
      inputWord,
      language,
      context,
    );

    const resultContent = await deepSeekChatAPI({
      sentence: sentencePrompt,
      language,
    });

    const sentenceWithId = {
      id: uuidv4(),
      ...resultContent,
    };

    await saveSentenceToContent({
      language,
      sentenceData: sentenceWithId,
      db,
    });

    await synthesizeSpeech({
      id: sentenceWithId.id,
      text: sentenceWithId.targetLang,
      language,
    });

    await updateWordContext({
      wordId: wordId,
      sentenceId: sentenceWithId.id,
      language,
    });

    res.status(200).json(sentenceWithId);
  } catch (error) {
    console.log('## /custom-word-prompt error', error);
    res.status(500).json({ error });
  }
};

export { adhocSentenceCustomWord };
