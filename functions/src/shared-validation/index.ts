import { body } from 'express-validator';

export type LanguageTypes = 'japanese' | 'chinese' | 'arabic';

const allowedLanguages: LanguageTypes[] = ['japanese', 'chinese', 'arabic'];

const languageValidation = [
  body('language')
    .notEmpty()
    .withMessage('language is required')
    .bail()
    .isString()
    .bail()
    .isIn(allowedLanguages)
    .withMessage(`language must be one of: ${allowedLanguages.join(', ')}`),
];

export { languageValidation };
