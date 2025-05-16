import { Request, Response } from 'express';
import { contentRef } from '../../refs';
import { getDataSnapshot } from '../../firebase-utils/get-data-snapshot';
import { db } from '../../db';
import { getContentIndexViaTitle } from '../../firebase-utils/get-content-index-via-title';
import { updateContentMetaDataValidation } from './validation';
import { routeValidator } from '../../shared-validation/route-validator';
import { updateDatabaseViaIndex } from '../../firebase-utils/update-database-via-index';

const updateContentMetaData = async ({ title, language, fieldToUpdate }) => {
  try {
    const contentSnapshotArr = await getDataSnapshot({
      language,
      ref: contentRef,
      db,
    });

    const { keys, index } = getContentIndexViaTitle({
      data: contentSnapshotArr,
      title,
    });

    if (index !== -1) {
      const key = keys[index];

      const updatedContent = await updateDatabaseViaIndex({
        language,
        indexKey: key.toString(),
        ref: contentRef,
        fieldToUpdate,
      });
      return updatedContent;
    } else {
      throw new Error("Couldn't find content to update");
    }
  } catch (error) {
    throw new Error('Error updating content metadata');
  }
};

export const updateContentMetaDataRoute = async (
  req: Request,
  res: Response,
): Promise<void> => {
  updateContentMetaDataValidation;
  const isValid = await routeValidator(
    req,
    res,
    updateContentMetaDataValidation,
  );
  if (!isValid) {
    return;
  }
  const { language, title, fieldToUpdate } = req.body;

  try {
    const fieldToUpdateRes = await updateContentMetaData({
      title,
      fieldToUpdate,
      language,
    });
    res.status(200).json(fieldToUpdateRes);
  } catch (error) {
    res
      .status(400)
      .json({ message: error?.message || 'Error updating content' });
  }
};
