import { body } from 'express-validator';
import { languageValidation } from '../shared-validation';

const textToSpeechValidation = [
  ...languageValidation,
  body('text')
    .notEmpty()
    .isString()
    .withMessage('Text from the target language is required'),
  ...languageValidation,
  body('id')
    .notEmpty()
    .isString()
    .withMessage('An id associated with the text is required'),
];

export { textToSpeechValidation };
