import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

export const updateWordObj = {
  wordId: 'wordId',
  language: 'language',
  fieldToUpdate: 'fieldToUpdate',
};

export const wordKeysRouteValidationObj = {
  id: 'id',
  baseForm: 'baseForm',
  definition: 'definition',
  contexts: 'contexts',
  reviewData: 'reviewData',
  surfaceForm: 'surfaceForm',
  transliteration: 'transliteration',
  phonetic: 'phonetic',
};

export const wordKeysRouteValidationArr = Object.keys(
  wordKeysRouteValidationObj,
);

const updateFieldForWordValidation = (value: object) => {
  if (!value || typeof value !== 'object') {
    throw new Error(
      `fieldToUpdate must be an object of: 
      ${wordKeysRouteValidationArr.join(', ')}`,
    );
  }

  const hasValidField = Object.keys(value).some((key) =>
    wordKeysRouteValidationArr.includes(key),
  );
  if (!hasValidField) {
    throw new Error(
      `fieldToUpdate must contain at least one of the following: ${wordKeysRouteValidationArr.join(
        ', ',
      )}`,
    );
  }

  return true;
};

export const updateWordValidation = [
  ...languageValidation,
  body(updateWordObj.wordId)
    .notEmpty()
    .isString()
    .withMessage('wordId is required for an update'),
  body(updateWordObj.fieldToUpdate).custom(updateFieldForWordValidation),
];
