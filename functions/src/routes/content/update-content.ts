import { Request, Response } from 'express';
// import { contentRef } from '../../refs';
// import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { db } from '../../db';
// import { getContentIndexViaTitle } from '../../firebase-utils/get-content-index-via-title';
import { updateContentMetaDataValidation } from './validation';
import { routeValidator } from '../../shared-validation/route-validator';
// import { updateDatabaseViaIndex } from '../../firebase-utils/update-database-via-index';
import { getContentRange } from '../../firebase-utils/experimental/read-content-efficient';
import { ContentType } from './types';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { LanguageTypes } from '../../language-keys';
import { contentRef, RefTypes } from '../../refs';

function findByTitleWithIndexKey(
  rangeObj: Record<string, any>,
  targetTitle: string,
): { indexKey: string; contentItem: ContentType } | null {
  const entry = Object.entries(rangeObj).find(
    ([_, value]) => value.title === targetTitle,
  );

  if (!entry) return null;

  const [indexKey, contentItem] = entry;
  return { indexKey, contentItem };
}

interface updateDatabaseViaIndexProps {
  language: LanguageTypes;
  indexKey: string | number; // numeric or string index
  ref: RefTypes;
  fieldToUpdate: Record<string, any>; // only the fields you want to update
}

const updateContentDatabaseViaIndex = async ({
  language,
  indexKey,
  fieldToUpdate,
  ref,
}: updateDatabaseViaIndexProps) => {
  try {
    const refPath = getRefPath({ language, ref });
    const childRef = db.ref(`${refPath}/${indexKey.toString()}`);

    // Update only the specified fields
    await childRef.update(fieldToUpdate);

    // Optional: fetch the updated object to return its current state
    const updatedSnapshot = await childRef.once('value');
    return updatedSnapshot.val();
  } catch (error) {
    console.error('Error updating database:', error);
    throw new Error(
      `Error updating content at indexKey "${indexKey}" for ${language}/${ref}`,
    );
  }
};

const updateContentMetaData = async ({
  title,
  language,
  contentIndex,
  fieldToUpdate,
}) => {
  try {
    const contentSnapshotObj = await getContentRange({
      language,
      db,
      contentIndex,
    });

    const { indexKey, contentItem } = findByTitleWithIndexKey(
      contentSnapshotObj,
      title,
    );

    if (contentItem) {
      return await updateContentDatabaseViaIndex({
        language,
        indexKey,
        fieldToUpdate,
        ref: contentRef,
      });
    } else {
      throw new Error(
        `Error finding content item title: ${title} indexKey: ${indexKey}`,
      );
    }
  } catch (error) {
    throw new Error('Error updating content metadata');
  }
};

export const updateContentMetaDataRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const isValid = await routeValidator(
    req,
    res,
    updateContentMetaDataValidation,
  );
  if (!isValid) {
    return;
  }

  const { language, title, fieldToUpdate, contentIndex } = req.body;

  try {
    const fieldToUpdateRes = await updateContentMetaData({
      title,
      fieldToUpdate,
      language,
      contentIndex,
    });

    res.status(200).json(fieldToUpdateRes);
  } catch (error) {
    res
      .status(400)
      .json({ message: error?.message || 'Error updating content' });
  }
};
