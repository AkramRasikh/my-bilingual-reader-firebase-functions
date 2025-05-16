import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

export const deleteWordValidation = [
  ...languageValidation,
  body('id').notEmpty().isString(),
];
