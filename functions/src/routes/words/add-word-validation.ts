import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const addWordKey = {
  word: 'word',
  context: 'context',
  contextSentence: 'contextSentence',
  isGoogle: 'isGoogle',
  reviewData: 'reviewData',
  meaning: 'meaning',
};

const addWordValidation = [
  ...languageValidation,
  body(addWordKey.word)
    .notEmpty()
    .isString()
    .withMessage(`Validation error passing ${addWordKey.word} for word`),
  body(addWordKey.context)
    .notEmpty()
    .isString()
    .withMessage(`${addWordKey.context} needs to be passed an id (string)`),
  body(addWordKey.contextSentence)
    .notEmpty()
    .isString()
    .withMessage(
      `A ${addWordKey.contextSentence} needs to be passed for translation`,
    ),
  body(addWordKey.isGoogle)
    .optional()
    .isBoolean()
    .withMessage(`A ${addWordKey.isGoogle} should be a boolean`),
  body(addWordKey.reviewData)
    .optional()
    .isObject()
    .withMessage(`A ${addWordKey.reviewData} should be an srs object`),
  body(addWordKey.meaning).optional().isString(),
];

export { addWordValidation };
