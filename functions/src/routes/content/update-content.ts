import { Request, Response } from 'express';
import { db } from '../../db';
import { updateContentMetaDataValidation } from './validation';
import { routeValidator } from '../../shared-validation/route-validator';
import { getRefPath } from '../../firebase-utils/get-ref-path';
import { LanguageTypes } from '../../language-keys';
import { contentRef } from '../../refs';

interface updateDatabaseViaIndexProps {
  language: LanguageTypes;
  contentId: string; // now the content id
  fieldToUpdate: Record<string, any>;
}

const updateContentDatabaseViaId = async ({
  language,
  contentId, // this is the id
  fieldToUpdate,
}: updateDatabaseViaIndexProps) => {
  try {
    const refPath = getRefPath({ language, ref: contentRef });
    const childRef = db.ref(`${refPath}/${contentId}`); // id is the key

    // Update only the specified fields
    await childRef.update(fieldToUpdate);

    // Optional: fetch the updated object to return its current state
    const updatedSnapshot = await childRef.once('value');
    return updatedSnapshot.val();
  } catch (error) {
    console.error('## Error updating database:', error);
    throw new Error(
      `Error updating content with id "${contentId}" for ${language}/${contentRef}`,
    );
  }
};

const updateContentMetaData = async ({
  language,
  fieldToUpdate,
  contentId,
}) => {
  try {
    return await updateContentDatabaseViaId({
      language,
      contentId,
      fieldToUpdate,
    });
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

  const { language, fieldToUpdate, contentId } = req.body;

  try {
    const fieldToUpdateRes = await updateContentMetaData({
      fieldToUpdate,
      language,
      contentId,
    });

    res.status(200).json(fieldToUpdateRes);
  } catch (error) {
    res
      .status(400)
      .json({ message: error?.message || 'Error updating content' });
  }
};
