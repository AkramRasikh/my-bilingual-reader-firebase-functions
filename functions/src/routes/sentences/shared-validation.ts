import { body, check } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const updateSentenceKeys = {
  id: 'id',
};

// update validation to reject anything that is not of the schema (need fixed schema!)
export const sharedUpdateSentenceValidation = [
  ...languageValidation,
  body(updateSentenceKeys.id)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${updateSentenceKeys.id} for update sentence`,
    ),
  // Custom check: At least one of the three fields must be present
  check('fieldToUpdate').custom((fieldToUpdate) => {
    if (
      !fieldToUpdate.targetLang &&
      !fieldToUpdate.baseLang &&
      !fieldToUpdate.notes &&
      !fieldToUpdate.time &&
      !fieldToUpdate.reviewData &&
      !fieldToUpdate.removeReview
    ) {
      throw new Error(
        'At least one of targetLang, baseLang, notes, time, removeReview, or reviewData is required in fieldToUpdate',
      );
    }
    return true;
  }),

  // Optional per-field checks
  body('fieldToUpdate.targetLang').optional().isString(),
  body('fieldToUpdate.baseLang').optional().isString(),
  body('fieldToUpdate.notes').optional().isString(),
  body('fieldToUpdate.time').optional().isNumeric(),

  // reviewData minimal check: if reviewData and reviewData.due exists, it must be ISO8601
  body('fieldToUpdate.reviewData').optional().isObject(),
  body('fieldToUpdate.removeReview').optional().isBoolean(),
  body('fieldToUpdate.reviewData.due')
    .optional()
    .isISO8601()
    .withMessage('reviewData.due must be a valid ISO8601 date string'),
];
