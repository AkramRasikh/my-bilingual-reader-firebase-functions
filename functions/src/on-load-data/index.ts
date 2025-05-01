import { Request, Response } from 'express';
import { getFirebaseContentType } from '../get-on-load-data';
import { LanguageTypes } from '../language-keys';
import { RefTypes } from '../refs';

interface OnLoadDataProps {
  language: LanguageTypes;
  refs: RefTypes[];
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
        throw new Error(`Error fetching ${ref} for language ${language}`);
      }
    }),
  );
}

export const onLoadDataRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refs, language } = req.body;
    if (!refs?.length || !language) {
      res.status(400).json({ error: 'Missing refs or language' });
      return;
    }

    const data = await onLoadDataFunc({ refs, language });
    res.status(200).json(data);
  } catch (error) {
    res
      .status(400)
      .json({ error: error?.message || 'Error loading initial data' });
  }
};
