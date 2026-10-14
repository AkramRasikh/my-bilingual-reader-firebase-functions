import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const addImprovWordKey = {
  inquiry: 'inquiry',
  inquiries: 'inquiries',
  context: 'context',
  reviewData: 'reviewData',
};

const hasInquiryList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => typeof item === 'string' && item.trim().length > 0);

const addImprovWordValidation = [
  ...languageValidation,
  body(addImprovWordKey.inquiry).custom((value, { req }) => {
    if (hasInquiryList(req.body?.inquiries)) {
      if (value === undefined) {
        return true;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return true;
      }
    } else if (typeof value === 'string' && value.trim().length > 0) {
      return true;
    }
    throw new Error(
      `Validation error passing ${addImprovWordKey.inquiry} for improv word`,
    );
  }),
  body(addImprovWordKey.inquiries)
    .optional()
    .custom((value) => {
      if (hasInquiryList(value)) {
        return true;
      }
      throw new Error(
        `Validation error passing ${addImprovWordKey.inquiries} for improv word`,
      );
    }),
  body(addImprovWordKey.context).optional().isString(),
  body(addImprovWordKey.reviewData)
    .optional()
    .isObject()
    .withMessage(`A ${addImprovWordKey.reviewData} should be an srs object`),
];

export { addImprovWordValidation };
