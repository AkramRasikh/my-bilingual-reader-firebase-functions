import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const ALLOWED_BODY_KEYS = ['language', 'contentId', 'snippetId'];

export const deleteSnippetValidation = [
  // Check for extra keys at body level
  body().custom((value, { req }) => {
    const extraKeys = Object.keys(req.body).filter(
      (key) => !ALLOWED_BODY_KEYS.includes(key),
    );
    if (extraKeys.length > 0) {
      throw new Error(`Unexpected fields: ${extraKeys.join(', ')}`);
    }
    return true;
  }),

  ...languageValidation,
  body('contentId')
    .notEmpty()
    .withMessage('contentId is required')
    .isString()
    .withMessage('contentId must be a string'),
  body('snippetId')
    .notEmpty()
    .withMessage('snippetId is required')
    .isString()
    .withMessage('snippetId must be a string'),
];
