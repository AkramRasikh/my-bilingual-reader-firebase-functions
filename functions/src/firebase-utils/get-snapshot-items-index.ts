interface SnapshotItemsPickerProps {
  arr: any[]; // update to reflect the ref types
  id: string;
}

type WithId = { id: string; [key: string]: any };

export const getThisItemsIndex = ({
  arr,
  id,
}: SnapshotItemsPickerProps): number => {
  const length = arr.length;
  for (let i = 0; i < length; i++) {
    const thisItem = arr[i].id === id;
    if (thisItem) {
      return i;
    }
  }
  return -1;
};

export const getThisItemsViaValues = ({
  arr,
  id,
}: SnapshotItemsPickerProps) => {
  const thisItemsValues = Object.values(arr) as WithId[];
  const keys = Object.keys(arr);
  const index = thisItemsValues.findIndex((item) => item.id === id);
  return { keys, index };
};
