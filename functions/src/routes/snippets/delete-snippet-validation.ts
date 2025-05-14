import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

export const deleteSnippetValidation = [
  ...languageValidation,
  body('id')
    .notEmpty()
    .isString()
    .withMessage('Validation error passing id to delete snippet'),
];
