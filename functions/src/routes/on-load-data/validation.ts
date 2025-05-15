import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const allowedRefs = ['snippets', 'content', 'sentences', 'words'];

const onLoadDataValidation = [
  ...languageValidation,
  body('refs')
    .notEmpty()
    .isArray({ min: 1 })
    .withMessage('refs is required to load data'),
  body('refs.*')
    .isString()
    .withMessage('Each ref must be a string')
    .isIn(allowedRefs)
    .withMessage(`Each ref must be one of: ${allowedRefs.join(', ')}`),
];

export { onLoadDataValidation };
