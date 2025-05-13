import { body } from 'express-validator';
import { languageValidation } from '../../shared-validation';

const snippetPrefix = 'snippet';

const snippetKeys = {
  id: `${snippetPrefix}.id`,
  sentenceId: `${snippetPrefix}.sentenceId`,
  duration: `${snippetPrefix}.duration`,
  pointInAudio: `${snippetPrefix}.pointInAudio`,
  topicName: `${snippetPrefix}.topicName`,
  url: `${snippetPrefix}.url`,
  targetLang: `${snippetPrefix}.targetLang`,
  isIsolated: `${snippetPrefix}.isIsolated`,
};

const addSnippetValidation = [
  ...languageValidation,
  body('snippet').notEmpty().withMessage('Snippet data was not passed'),
  body(snippetKeys.id)
    .notEmpty()
    .isString()
    .withMessage(`Validation error passing ${snippetKeys.id} for snippets`),
  body(snippetKeys.sentenceId)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${snippetKeys.sentenceId} for snippets`,
    ),
  body(snippetKeys.duration)
    .notEmpty()
    .isNumeric()
    .withMessage(
      `Validation error passing ${snippetKeys.duration} for snippets`,
    ),
  body(snippetKeys.pointInAudio)
    .notEmpty()
    .isNumeric()
    .withMessage(
      `Validation error passing ${snippetKeys.pointInAudio} for snippets`,
    ),
  body(snippetKeys.topicName)
    .notEmpty()
    .isString()
    .withMessage(
      `Validation error passing ${snippetKeys.topicName} for snippets`,
    ),
  body(snippetKeys.url)
    .notEmpty()
    .isString()
    .withMessage(`Validation error passing ${snippetKeys.url} for snippets`),
  body(snippetKeys.targetLang)
    .optional()
    .isString()
    .withMessage(
      `Validation error passing ${snippetKeys.targetLang} for snippets`,
    ),
  body(snippetKeys.isIsolated)
    .optional()
    .isBoolean()
    .withMessage(
      `Validation error passing ${snippetKeys.isIsolated} for snippets`,
    ),
];

export { addSnippetValidation };
