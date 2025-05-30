import { body, check } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const updateSentenceKeys = {
  id: 'id',
  title: 'title',
};

const updateSentenceValidation = [
  ...languageValidation,
  body(updateSentenceKeys.id)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${updateSentenceKeys.id} for update sentence`,
    ),
  body(updateSentenceKeys.title)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${updateSentenceKeys.title} for update sentence`,
    ),
  // Custom check: At least one of the three fields must be present
  check('fieldToUpdate').custom((fieldToUpdate, { req }) => {
    if (!fieldToUpdate || typeof fieldToUpdate !== 'object') {
      throw new Error('fieldToUpdate must be an object');
    }

    const { targetLang, baseLang, notes } = fieldToUpdate;

    if (
      targetLang === undefined &&
      baseLang === undefined &&
      notes === undefined
    ) {
      throw new Error(
        'At least one of targetLang, baseLang, notes, or time is required in fieldToUpdate',
      );
    }

    return true;
  }),
];

export { updateSentenceValidation };
