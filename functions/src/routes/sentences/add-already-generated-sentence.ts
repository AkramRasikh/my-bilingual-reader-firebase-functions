import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { getInitSentenceCard } from '../../srs-utils';
import { addSentencesBulk } from '../../firebase-utils/add-sentences-bulk';

const addAlreadyGeneratedSentenceRoute = async (
  req: Request,
  res: Response,
) => {
  const language = req.body.language;
  const targetLang = req.body.targetLang;
  const baseLang = req.body.baseLang;
  const notes = req.body?.notes;

  try {
    const sentencesToAddFromDB = await addSentencesBulk({
      language,
      sentencesBulk: [
        {
          id: uuidv4(),
          topic: 'sentence-helper',
          hasAudio: true,
          baseLang,
          targetLang,
          reviewData: getInitSentenceCard(),
          notes,
        },
      ],
    });

    res.status(200).json(sentencesToAddFromDB);
  } catch (error) {
    console.log('## /adhoc-sentence-tts error', error);
    res.status(500).json({ error });
  }
};

export { addAlreadyGeneratedSentenceRoute };
