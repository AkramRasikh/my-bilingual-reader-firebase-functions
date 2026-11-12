import { Request, Response } from 'express';
import { body } from 'express-validator';
import { db } from '../../db';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { LanguageTypes } from '../../language-keys';
import { settingsRef } from '../../refs';
import { getCatalogForLanguage, resolveRuleKeys } from '../../rules';
import { MAX_STRUCTURE_RULES } from '../../rules/build-structures-prompt';
import { languageValidation } from '../../shared-validation';
import { routeValidator } from '../../shared-validation/route-validator';

export const breakdownRulesKey = 'breakdownRules';

const updateBreakdownRulesValidation = [
  ...languageValidation,
  body('ruleKeys')
    .isArray({ max: MAX_STRUCTURE_RULES })
    .withMessage(
      `ruleKeys must be an array of at most ${MAX_STRUCTURE_RULES} rule keys`,
    ),
  body('ruleKeys.*').isString().withMessage('Each rule key must be a string'),
];

export const saveBreakdownRules = async ({
  language,
  ruleKeys,
}: {
  language: LanguageTypes;
  ruleKeys: string[];
}) => {
  const validKeys = resolveRuleKeys(ruleKeys, language).map((rule) => rule.key);
  await db
    .ref(`${getRefPath({ language, ref: settingsRef })}/${breakdownRulesKey}`)
    .set(validKeys);
  return validKeys;
};

export const updateBreakdownRulesRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(
    req,
    res,
    updateBreakdownRulesValidation,
  );
  if (!isValid) {
    return;
  }

  const { language, ruleKeys } = req.body;

  try {
    const savedKeys = await saveBreakdownRules({ language, ruleKeys });
    res.status(200).json({ [breakdownRulesKey]: savedKeys });
  } catch (error) {
    res
      .status(400)
      .json({ error: error?.message || 'Error updating breakdown rules' });
  }
};

export const getRuleCatalogRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(req, res, languageValidation);
  if (!isValid) {
    return;
  }

  res.status(200).json(getCatalogForLanguage(req.body.language));
};
