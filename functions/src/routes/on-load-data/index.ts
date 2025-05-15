import { Request, Response } from 'express';
import { LanguageTypes } from '../../language-keys';
import { RefTypes } from '../../refs';
import { onLoadDataValidation } from './validation';
import { routeValidator } from '../../shared-validation/route-validator';
import { getFirebaseContentType } from '../../firebase-utils/get-firebase-content-type';

interface OnLoadDataProps {
  language: LanguageTypes;
  refs: RefTypes[];
}

export interface LangaugeAndContentTypes {
  language: LanguageTypes;
  ref: RefTypes;
}

export async function onLoadDataFunc({
  language,
  refs,
}: OnLoadDataProps): Promise<any> {
  return await Promise.all(
    refs.map(async (ref) => {
      try {
        const refData = await getFirebaseContentType({ language, ref });
        return {
          [ref]: refData,
        };
      } catch (error) {
        throw new Error(`Error fetching ${ref} for ${language}`);
      }
    }),
  );
}

export const onLoadDataRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const isValid = await routeValidator(req, res, onLoadDataValidation);
    if (!isValid) {
      return;
    }
    const { refs, language } = req.body;
    const data = await onLoadDataFunc({ refs, language });
    res.status(200).json(data);
  } catch (error) {
    res
      .status(400)
      .json({ error: error?.message || 'Error loading initial data' });
  }
};
