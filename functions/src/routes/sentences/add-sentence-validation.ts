import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const adhocSentenceTTSValidation = [
  ...languageValidation,
  body('sentence').isString().notEmpty(),
  body('context').isString().optional(),
  body('includeVariations').isBoolean().optional(),
];
const adhocExpressionTTSValidation = [
  ...languageValidation,
  body('inquiry').isString().notEmpty(),
  body('context').isString().optional(),
  body('includeVariations').isBoolean().optional(),
];
const adhocGrammarTTSValidation = [
  ...languageValidation,
  body('baseSentence').isString().notEmpty(),
  body('context').isString().optional(),
  body('grammarSection').isString().optional(),
  body('includeVariations').isBoolean().optional(),
  body('isSubtleDiff').isBoolean().optional(),
];

const adhocMinimalPairingWordTTSValidation = [
  ...languageValidation,
  body('inputWord.id').isString().notEmpty(),
  body('inputWord.word').isString().notEmpty(),
  body('inputWord.definition').isString().optional(),
  body('isMeaning').isString().optional(),
  body('isVisual').isBoolean().optional(),
];
const adhocCustomWordTTSValidation = [
  ...languageValidation,
  body('inputWord.id').isString().notEmpty(),
  body('inputWord.word').isString().notEmpty(),
  body('inputWord.definition').isString().optional(),
  body('prompt').isString(),
];

export {
  adhocExpressionTTSValidation,
  adhocSentenceTTSValidation,
  adhocGrammarTTSValidation,
  adhocMinimalPairingWordTTSValidation,
  adhocCustomWordTTSValidation,
};
