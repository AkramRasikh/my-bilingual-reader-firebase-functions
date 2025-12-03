import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const updateSentenceReviewBulkKeys = {
  id: 'id',
  contentId: 'contentId',
  sentenceIds: 'sentenceIds',
  reviewData: 'reviewData',
};

const updateSentenceReviewBulkValidation = [
  ...languageValidation,
  body(updateSentenceReviewBulkKeys.contentId)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${updateSentenceReviewBulkKeys.contentId} for update sentence`,
    ),
  body(updateSentenceReviewBulkKeys.sentenceIds).notEmpty().isArray({ min: 1 }),
  body(`${updateSentenceReviewBulkKeys.sentenceIds}.*`).isString(),
  body(`${updateSentenceReviewBulkKeys.reviewData}`).isObject(),
];

export { updateSentenceReviewBulkValidation };
