import { body } from 'express-validator';
import { sharedUpdateSentenceValidation } from './shared-validation';

const updateSentenceKeys = {
  id: 'id',
  indexKey: 'indexKey',
};

const updateSentenceValidation = [
  body(updateSentenceKeys.indexKey)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${updateSentenceKeys.indexKey} for update sentence`,
    ),
  ...sharedUpdateSentenceValidation,
];

export { updateSentenceValidation };
