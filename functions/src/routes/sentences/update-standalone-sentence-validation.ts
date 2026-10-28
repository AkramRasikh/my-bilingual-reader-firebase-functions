import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const hasUpdateField = (fieldToUpdate: {
  targetLang?: string;
  baseLang?: string;
  notes?: string;
  sentenceStructure?: string;
  meaning?: string;
  vocab?: unknown[];
  reviewData?: unknown;
  removeReview?: boolean;
}) =>
  Boolean(
    fieldToUpdate &&
      (fieldToUpdate.targetLang ||
        fieldToUpdate.baseLang ||
        fieldToUpdate.notes ||
        fieldToUpdate.sentenceStructure ||
        fieldToUpdate.meaning ||
        fieldToUpdate.reviewData ||
        fieldToUpdate.removeReview ||
        (Array.isArray(fieldToUpdate.vocab) && fieldToUpdate.vocab.length > 0)),
  );

export const updateStandaloneSentenceValidation = [
  ...languageValidation,
  body('id')
    .notEmpty()
    .isString()
    .withMessage('Validation error passing id for update sentence'),
  body('delete').optional().isBoolean(),
  body('fieldToUpdate').custom((fieldToUpdate, { req }) => {
    if (req.body?.delete === true) {
      return true;
    }
    if (!hasUpdateField(fieldToUpdate)) {
      throw new Error(
        'At least one of targetLang, baseLang, notes, vocab, sentenceStructure, meaning, reviewData, or removeReview is required in fieldToUpdate',
      );
    }
    return true;
  }),
  body('fieldToUpdate.targetLang').optional().isString(),
  body('fieldToUpdate.baseLang').optional().isString(),
  body('fieldToUpdate.notes').optional().isString(),
  body('fieldToUpdate.sentenceStructure').optional().isString(),
  body('fieldToUpdate.meaning').optional().isString(),
  body('fieldToUpdate.vocab').optional().isArray({ min: 1 }),
  body('fieldToUpdate.vocab.*.surfaceForm')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('each vocab item needs a surfaceForm'),
  body('fieldToUpdate.vocab.*.meaning')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('each vocab item needs a meaning'),
  body('fieldToUpdate.reviewData').optional().isObject(),
  body('fieldToUpdate.removeReview').optional().isBoolean(),
  body('fieldToUpdate.reviewData.due')
    .optional()
    .isISO8601()
    .withMessage('reviewData.due must be a valid ISO8601 date string'),
];
