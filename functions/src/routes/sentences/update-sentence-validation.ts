import { body } from 'express-validator';
import { sharedUpdateSentenceValidation } from './shared-validation';

const updateSentenceKeys = {
  id: 'id',
  title: 'title',
};

const updateSentenceValidation = [
  body(updateSentenceKeys.title)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${updateSentenceKeys.title} for update sentence`,
    ),
  ...sharedUpdateSentenceValidation,
];

export { updateSentenceValidation };
