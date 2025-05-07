import { body } from 'express-validator';
import { languageValidation } from '../shared-validation';

const translateTextValidation = [
  ...languageValidation,
  body('text')
    .notEmpty()
    .isString()
    .withMessage('text from the target language is required'),
];

export { translateTextValidation };
