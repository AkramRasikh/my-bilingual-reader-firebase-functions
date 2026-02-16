import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

export const deleteWordValidation = [
  ...languageValidation,
  body('id').notEmpty().isString(),
  body('additionalContext')
    .optional()
    .isArray({ min: 0 })
    .withMessage('additionalContext must be an array if provided'),
  body('additionalContext.*')
    .optional()
    .isString()
    .withMessage('Each additionalContext id must be a string'),
];
