import { Request, Response } from 'express';

import { arabic, chinese, french, japanese } from '../../language-keys';
import { updateSentenceInContent } from './update-sentence';
import { deepSeekChatAPI } from '../../ai-utils';
import { resolveRuleKeys } from '../../rules';
import {
  buildStructuresPrompt,
  MAX_STRUCTURE_RULES,
  sanitizeStructures,
  structuresSchemaLine,
} from '../../rules/build-structures-prompt';

const japaneseSentenceStructure =
  '"すでに長刀(薙刀)の稽古に励んでいます": "すでに (already) + 長刀(薙刀)の稽古 (naginata practice) + に励んでいます (is diligently practicing)"';
const chineseSentenceStructure =
  '"我已经开始学习中文了": "我 (I) + 已经 (already) + 开始 (begin) + 学习 (study) + 中文 (Chinese) + 了 (completed action particle)"';
const arabicSentenceStructure =
  '"ذهبت إلى المكتبة لكن لم أدرس": "ذهبت (I went) + إلى (to) + المكتبة (the library) + لكن (but) + لم (negation for past) + أدرس (I study)"';
const frenchSentenceStructure =
  '"Je vais apprendre le francais demain": "Je (I) + vais (am going) + apprendre (to learn) + le (the) + francais (French) + demain (tomorrow)"';

const sentenceStructureObj = {
  [japanese]: japaneseSentenceStructure,
  [chinese]: chineseSentenceStructure,
  [arabic]: arabicSentenceStructure,
  [french]: frenchSentenceStructure,
};

export const breakdownSentenceRoute = async (req: Request, res: Response) => {
  const {
    id,
    language,
    targetLang,
    indexKey,
    prevSentence,
    nextSentence,
    contentDescription,
    structureRuleKeys,
  } = req.body;

  if (
    structureRuleKeys !== undefined &&
    (!Array.isArray(structureRuleKeys) ||
      structureRuleKeys.length > MAX_STRUCTURE_RULES)
  ) {
    res.status(400).json({
      error: `structureRuleKeys must be an array of at most ${MAX_STRUCTURE_RULES} rule keys`,
    });
    return;
  }

  // Unknown keys and rules for other languages are dropped. With no rules
  // the prompt (and response) is exactly the plain breakdown.
  const structureRules = resolveRuleKeys(structureRuleKeys, language);
  const hasStructureRules = structureRules.length > 0;
  const structuresSchemaPrompt = hasStructureRules
    ? ` ${structuresSchemaLine}`
    : '';
  const structuresPrompt = buildStructuresPrompt(structureRules);

  const additionalContext: string[] = [];
  if (typeof prevSentence === 'string' && prevSentence.trim()) {
    additionalContext.push(`Previous sentence: ${prevSentence}`);
  }
  if (typeof nextSentence === 'string' && nextSentence.trim()) {
    additionalContext.push(`Next sentence: ${nextSentence}`);
  }
  if (typeof contentDescription === 'string' && contentDescription.trim()) {
    additionalContext.push(`Content description: ${contentDescription}`);
  }
  const additionalContextPrompt =
    additionalContext.length > 0
      ? ` Additional context for better interpretation: ${additionalContext.join(
          ' | ',
        )}.`
      : '';

  const prompt = `Break down the following ${language} sentence strictly into valid JSON output. Do not include explanations, preamble, or any additional text. 
  The JSON format should have the following structure: vocab: An array of objects where each object contains: surfaceForm: The word or phrase as it appears in the sentence. meaning: A brief explanation of its meaning in English. 
  sentenceStructure: A string that represents the sentence structure, maintaining the original word order but adding inline English meanings. For example: Format Example: word (meaning) + word (meaning) + word (meaning) Example Output for a sentence like ${
    sentenceStructureObj[language] || sentenceStructureObj[japanese]
  }. meaning: A string giving a natural translation or explanation of the full sentence in English.${structuresSchemaPrompt} Sentence to analyze: ${targetLang}.${additionalContextPrompt}
  
  
  ${structuresPrompt}  `;

  try {
    const breakdown = await deepSeekChatAPI({
      sentence: prompt,
      language,
    });

    if (breakdown) {
      const { structures: rawStructures, ...rest } = breakdown;
      const fieldToUpdate = hasStructureRules
        ? {
            ...rest,
            structures: sanitizeStructures(
              rawStructures,
              new Set(structureRules.map((rule) => rule.key)),
            ),
          }
        : rest;
      await updateSentenceInContent({
        id,
        language,
        indexKey,
        fieldToUpdate,
      });
      res.status(200).json(fieldToUpdate);
    } else {
      res.status(400).json({ error: 'No breakdown?' });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
};
