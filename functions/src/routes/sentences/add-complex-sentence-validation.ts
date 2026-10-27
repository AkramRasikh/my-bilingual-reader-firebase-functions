import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';
import {
  GRAMMAR_CATEGORIES,
  isGrammarSetting,
} from './complex-sentence-grammar';

const allowedCategories = new Set<string>(GRAMMAR_CATEGORIES);

const addComplexSentenceValidation = [
  ...languageValidation,
  body('words')
    .isArray({ min: 1 })
    .withMessage('words must be a non-empty array'),
  body('words.*.surfaceForm')
    .isString()
    .notEmpty()
    .withMessage('each word needs a surfaceForm'),
  body('words.*.baseForm')
    .isString()
    .notEmpty()
    .withMessage('each word needs a baseForm'),
  body('words.*.definition')
    .isString()
    .notEmpty()
    .withMessage('each word needs a definition'),
  body('words.*.localContext')
    .isString()
    .withMessage('each word needs a localContext string'),
  body('config')
    .optional()
    .isObject()
    .withMessage('config must be an object')
    .custom((value: Record<string, unknown>) => {
      for (const [key, setting] of Object.entries(value)) {
        if (!allowedCategories.has(key)) {
          throw new Error(`Unknown grammar setting ${key}`);
        }
        if (!isGrammarSetting(setting)) {
          throw new Error(
            `${key} must be "auto", true, or false`,
          );
        }
      }
      return true;
    }),
  body('notes').optional().isString().withMessage('notes must be a string'),
];

export { addComplexSentenceValidation };
