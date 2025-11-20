import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const fieldToUpdatePrefix = 'fieldToUpdate';
const updateContentKeysRouteValidationObj = {
  indexKey: 'indexKey',
  reviewData: `${fieldToUpdatePrefix}.reviewData`,
  nextReview: `${fieldToUpdatePrefix}.nextReview`,
  origin: `${fieldToUpdatePrefix}.origin`,
  reviewHistory: `${fieldToUpdatePrefix}.reviewHistory`,
  isCore: `${fieldToUpdatePrefix}.isCore`,
  hasAudio: `${fieldToUpdatePrefix}.hasAudio`,
  snippets: `${fieldToUpdatePrefix}.snippets`,
};
const updateContentKeysRouteValidationArr = Object.keys(
  updateContentKeysRouteValidationObj,
);

const updateFieldForContentValidation = (value: object) => {
  if (!value || typeof value !== 'object') {
    throw new Error(
      `${fieldToUpdatePrefix} must be an object of: 
      ${updateContentKeysRouteValidationArr.join(', ')}`,
    );
  }

  const hasValidField = Object.keys(value).some((key) =>
    updateContentKeysRouteValidationArr.includes(key),
  );
  if (!hasValidField) {
    throw new Error(
      `${fieldToUpdatePrefix} must contain at least one of the following: ${updateContentKeysRouteValidationArr.join(
        ', ',
      )}`,
    );
  }

  return true;
};

export const updateContentMetaDataValidation = [
  ...languageValidation,
  body(fieldToUpdatePrefix).notEmpty().custom(updateFieldForContentValidation),
  body(updateContentKeysRouteValidationObj.indexKey).notEmpty().isString(),
  body(updateContentKeysRouteValidationObj.reviewData).optional(),
  body(updateContentKeysRouteValidationObj.nextReview).optional(),
  body(updateContentKeysRouteValidationObj.origin).optional().isString(),
  body(updateContentKeysRouteValidationObj.reviewHistory).optional(),
  body(updateContentKeysRouteValidationObj.isCore).optional().isBoolean(),
  body(updateContentKeysRouteValidationObj.hasAudio).optional().isBoolean(),
  body(updateContentKeysRouteValidationObj.snippets).optional().isArray(),
];
