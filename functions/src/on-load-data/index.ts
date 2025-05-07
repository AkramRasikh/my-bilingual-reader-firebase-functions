import { Request, Response } from 'express';
import { db } from '../db';
import { LanguageTypes } from '../language-keys';
import { contentRef, RefTypes } from '../refs';
import { onLoadDataValidation } from './validation';
import { routeValidator } from '../shared-validation/route-validator';
import { getDataSnapshot } from '../firebase-utils/get-data-snapshot';
import { filterOutNestedNulls } from '../utils/filter-out-nested-nulls';

interface OnLoadDataProps {
  language: LanguageTypes;
  refs: RefTypes[];
}

export interface LangaugeAndContentTypes {
  language: LanguageTypes;
  ref: RefTypes;
}

export const getFirebaseContentType = async ({
  language,
  ref,
}: LangaugeAndContentTypes) => {
  try {
    const thisContentTypeSnapShot = await getDataSnapshot({
      language,
      ref,
      db,
    });
    const realValues = filterOutNestedNulls(thisContentTypeSnapShot);
    if (ref === contentRef) {
      const filteredOutUndefinedNull = realValues.map(
        (thisLangaugeContentItem) => {
          return {
            ...thisLangaugeContentItem,
            content: filterOutNestedNulls(thisLangaugeContentItem.content),
          };
        },
      );
      return filteredOutUndefinedNull;
    } else {
      return realValues;
    }
  } catch (error) {
    throw new Error(
      error || `Failed to get contentType ${ref} for ${language}`,
    );
  }
};

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
