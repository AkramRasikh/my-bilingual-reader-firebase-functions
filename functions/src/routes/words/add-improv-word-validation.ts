import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const addImprovWordKey = {
  inquiry: 'inquiry',
  context: 'context',
  reviewData: 'reviewData',
};

const addImprovWordValidation = [
  ...languageValidation,
  body(addImprovWordKey.inquiry)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${addImprovWordKey.inquiry} for improv word`,
    ),
  body(addImprovWordKey.context).optional().isString(),
  body(addImprovWordKey.reviewData)
    .optional()
    .isObject()
    .withMessage(`A ${addImprovWordKey.reviewData} should be an srs object`),
];

export { addImprovWordValidation };
