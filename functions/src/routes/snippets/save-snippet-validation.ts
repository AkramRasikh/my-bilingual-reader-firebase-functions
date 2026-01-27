import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const snippetKeys = {
  id: 'snippetData.id',
  baseLang: 'snippetData.baseLang',
  targetLang: 'snippetData.targetLang',
  time: 'snippetData.time',
  reviewData: 'snippetData.reviewData',
  focusedText: 'snippetData.focusedText',
  isContracted: 'snippetData.isContracted',
  isPreSnippet: 'snippetData.isPreSnippet',
  suggestedFocusText: 'snippetData.suggestedFocusText',
  contentId: 'contentId',
};

const ALLOWED_SNIPPET_KEYS = [
  'id',
  'baseLang',
  'targetLang',
  'time',
  'reviewData',
  'focusedText',
  'isContracted',
  'isPreSnippet',
  'suggestedFocusText',
];

const ALLOWED_BODY_KEYS = ['language', 'contentId', 'snippetData'];

export const saveSnippetValidation = [
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

  // Check for extra keys in snippetData
  body('snippetData').custom((value) => {
    if (value && typeof value === 'object') {
      const extraKeys = Object.keys(value).filter(
        (key) => !ALLOWED_SNIPPET_KEYS.includes(key),
      );
      if (extraKeys.length > 0) {
        throw new Error(
          `Unexpected snippetData fields: ${extraKeys.join(', ')}`,
        );
      }
    }
    return true;
  }),

  ...languageValidation,
  body(snippetKeys.contentId)
    .notEmpty()
    .withMessage('contentId is required')
    .isString()
    .withMessage('contentId must be a string'),
  body('snippetData')
    .notEmpty()
    .withMessage('snippetData is required')
    .isObject()
    .withMessage('snippetData must be an object'),
  body(snippetKeys.id)
    .notEmpty()
    .withMessage('snippetData.id is required')
    .isString()
    .withMessage('snippetData.id must be a string'),
  body(snippetKeys.baseLang)
    .notEmpty()
    .withMessage('snippetData.baseLang is required')
    .isString()
    .withMessage('snippetData.baseLang must be a string'),
  body(snippetKeys.targetLang)
    .notEmpty()
    .withMessage('snippetData.targetLang is required')
    .isString()
    .withMessage('snippetData.targetLang must be a string'),
  body(snippetKeys.time)
    .notEmpty()
    .withMessage('snippetData.time is required')
    .isNumeric()
    .withMessage('snippetData.time must be a number'),
  body(snippetKeys.reviewData).optional().isObject(),
  body(snippetKeys.focusedText).optional().isString(),
  body(snippetKeys.isContracted).optional().isBoolean(),
  body(snippetKeys.isPreSnippet).optional().isBoolean(),
  body(snippetKeys.suggestedFocusText).optional().isString(),
];
