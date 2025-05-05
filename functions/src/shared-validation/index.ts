import { body } from 'express-validator';

const languageValidation = [
  body('language').notEmpty().isString().withMessage('language is required'),
];

export { languageValidation };
