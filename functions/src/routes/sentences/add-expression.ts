import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { deepSeekChatAPI } from '../../ai-utils';
import { getInitSentenceCard } from '../../srs-utils';
import { addSentencesBulk } from '../../firebase-utils/add-sentences-bulk';
import { synthesizeSpeech } from '../text-to-speech';

// import { getInitSentenceCard } from '../../srs-utils';

const targetLanguage = 'Japanese';
// const targetWord = '';
// const extraContext = '';
// const expressionInquiry = '';

const addExpressionRequirments = `
  ## Requirements:

  1. Language must be natural, clear and concise.
  2. An informal conversational style is preferred unless the context suggests otherwise
  3. Remember, this is not a like for like translation but a summariser of the inquiry and then a cultural equivalent of what is being inquired
  4. It can be multiple sentences (or compound sentences) but this will be used in a text-to-speech service so ideally under 8 seconds
`;

// const baseJSONReturnObj = `
//     Return the response as a JSON object with (and only with) a \`sentence\` object.
//     Each sentence should contain:
//     1. \`baseLang\`: The English sentence.
//     2. \`targetLang\`: The sentence in ${targetLanguage}.
//     3. \`matchedWordsSurface\`: An array of the words (in their original script ${targetLanguage}) that appear in the sentence, even if their form is slightly altered (e.g., conjugated, pluralized, etc.).
//     4. \`matchedWordsId\`: An array of the corresponding word IDs that were used in the sentence.
//     4. \`notes\`: Explain any nuances that may be relevant to me as a learner
// `;
const addExpressionJSONReturnObj = `
    Return the response as a JSON object with (and only with) a \`sentence\` object. 
    Each sentence should contain:
    1. \`baseLang\`: The English translation of the anticipated output.
    2. \`targetLang\`: The sentence in ${targetLanguage}.
    4. \`notes\`: Explain any nuances that may be relevant to me as a learner
`;

// const addWordPrompt = `
//   I am studying ${targetLanguage}. I want to know the word/phrase is for ${targetWord}.
//   ${
//     extraContext
//       ? `More specifically given the following context its to be used in context: ${extraContext}`
//       : ''
//   }
// `;

const getAddExpressionPrompt = (language, inquiry, context) => {
  const addExpressionPrompt = `
  I am studying ${language}. I want to know how to express the following.

  ## Expression inquiry: ${inquiry}.
  ${context ? `## Additional relevant context: "${context}"` : ''}

  ${addExpressionRequirments}

  ${addExpressionJSONReturnObj}
`;

  return addExpressionPrompt;
};

const addExpressionRoute = async (req: Request, res: Response) => {
  const language = req.body.language;
  const inquiry = req.body.inquiry;
  const context = req.body?.context;

  const expressionPrompt = getAddExpressionPrompt(language, inquiry, context);

  try {
    const resultContent = await deepSeekChatAPI({
      sentence: expressionPrompt,
    });

    const sentenceObj = {
      ...resultContent.sentence,
      id: uuidv4(),
      topic: 'sentence-helper',
      hasAudio: true,
      reviewData: getInitSentenceCard(),
      inquiry,
      context,
    };

    const sentencesWithIds = await addSentencesBulk({
      language,
      sentencesBulk: [sentenceObj],
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

    res.status(200).json(sentenceObj);
  } catch (error) {
    console.log('## /add-expression error', error);
    res.status(500).json({ error });
  }
};

export { addExpressionRoute };
