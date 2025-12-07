import { db } from '../db';
import { isValidItem } from '../utils/is-valid-item';
import { getDataSnapshot } from './get-data-snapshot';
import { getRefPath } from './get-ref-path';

export const removeItemFromSnapshot = async ({ ref, language, id }) => {
  try {
    const refPath = getRefPath({
      ref,
      language,
    });
    const snapshotArr = await getDataSnapshot({
      ref,
      language,
      db,
    });

    let deletedItemId;

    const updatedSnapShot =
      snapshotArr?.length > 0
        ? snapshotArr.filter((item) => {
            if (!isValidItem(item)) {
              return false;
            }
            if (item.id === id) {
              deletedItemId = item.id;
              return false;
            }

            return true;
          })
        : [];

    await db.ref(refPath).set(updatedSnapShot);
    return deletedItemId;
  } catch (error) {
    throw new Error(`Error removing item from db: ${language} ${ref}`);
  }
};

export const removeMultiItemFromSnapshot = async ({ ref, language, ids }) => {
  try {
    const refPath = getRefPath({
      ref,
      language,
    });
    const snapshotArr = await getDataSnapshot({
      ref,
      language,
      db,
    });

    const deletedItemIds = [];

    const updatedSnapShot =
      snapshotArr?.length > 0
        ? snapshotArr.filter((item) => {
            if (!isValidItem(item)) {
              return false;
            }
            if (ids.includes(item.id)) {
              deletedItemIds.push(item.id);
              return false;
            }

            return true;
          })
        : [];

    await db.ref(refPath).set(updatedSnapShot);
    return deletedItemIds;
  } catch (error) {
    throw new Error(`Error removing item from db: ${language} ${ref}`);
  }
};
