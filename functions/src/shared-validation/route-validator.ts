import { Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';

export const routeValidator = async (
  req: Request,
  res: Response,
  validationRules: ValidationChain[],
): Promise<void> => {
  // Run validation manually
  await Promise.all(validationRules.map((validation) => validation.run(req)));
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
};
