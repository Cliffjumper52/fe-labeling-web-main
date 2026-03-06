export type StoredImageRef = {
  id: string;
  name: string;
};

type StoredImageRecord = {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
};

const DB_NAME = "fe-labeling-image-store";
const DB_VERSION = 1;
const STORE_NAME = "images";
const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";

type LocalTaskRecord = Record<string, unknown>;
type LegacyImage = { name: string; dataUrl: string };

const openImageDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

const dataUrlToBlob = (dataUrl: string): Blob | null => {
  const parts = dataUrl.split(",");
  if (parts.length !== 2 || !parts[0].includes(";base64")) {
    return null;
  }

  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  try {
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } catch {
    return null;
  }
};

const createPlaceholderDataUrl = (label: string) => {
  const safe = encodeURIComponent(label);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#374151' font-size='20' font-family='Arial, sans-serif'>${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

const parseLegacyImages = (value: unknown): LegacyImage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const raw = item as { name?: unknown; dataUrl?: unknown };
      if (typeof raw.name !== "string" || typeof raw.dataUrl !== "string") {
        return null;
      }
      return { name: raw.name, dataUrl: raw.dataUrl };
    })
    .filter((item): item is LegacyImage => item !== null);
};

const parseStoredRefs = (value: unknown): StoredImageRef[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const raw = item as { id?: unknown; name?: unknown };
      if (typeof raw.id !== "string" || typeof raw.name !== "string") {
        return null;
      }
      return { id: raw.id, name: raw.name };
    })
    .filter((item): item is StoredImageRef => item !== null);
};

const putRecord = (
  store: IDBObjectStore,
  record: StoredImageRecord,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveFilesToImageStore = async (
  files: Array<{ name: string; file: File }>,
): Promise<StoredImageRef[]> => {
  if (typeof window === "undefined" || files.length === 0) {
    return [];
  }

  const db = await openImageDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const refs: StoredImageRef[] = files.map((item) => ({
    id: crypto.randomUUID(),
    name: item.name,
  }));

  await Promise.all(
    refs.map((ref, index) => {
      return new Promise<void>((resolve, reject) => {
        const record: StoredImageRecord = {
          id: ref.id,
          name: ref.name,
          blob: files[index].file,
          createdAt: Date.now(),
        };
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }),
  );

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  db.close();
  return refs;
};

export const loadImagesFromStore = async (
  refs: StoredImageRef[],
): Promise<Array<{ name: string; dataUrl: string }>> => {
  if (typeof window === "undefined" || refs.length === 0) {
    return [];
  }

  const db = await openImageDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const records = await Promise.all(
    refs.map((ref) => {
      return new Promise<StoredImageRecord | null>((resolve, reject) => {
        const request = store.get(ref.id);
        request.onsuccess = () => {
          const record = request.result as StoredImageRecord | undefined;
          resolve(record ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    }),
  );

  db.close();

  const resolved = await Promise.all(
    records.map(async (record, index) => {
      if (!record) {
        return null;
      }
      return {
        name: refs[index].name || record.name,
        dataUrl: await blobToDataUrl(record.blob),
      };
    }),
  );

  return resolved.filter((item): item is { name: string; dataUrl: string } => item !== null);
};

export const migrateLegacyTaskImagesToIndexedDb = async (): Promise<{
  migrated: boolean;
  migratedImageCount: number;
}> => {
  if (typeof window === "undefined") {
    return { migrated: false, migratedImageCount: 0 };
  }

  const raw = localStorage.getItem(ANNOTATOR_TASKS_STORAGE_KEY);
  if (!raw) {
    return { migrated: false, migratedImageCount: 0 };
  }

  let tasks: LocalTaskRecord[] = [];
  try {
    const parsed = JSON.parse(raw) as LocalTaskRecord[];
    if (!Array.isArray(parsed)) {
      return { migrated: false, migratedImageCount: 0 };
    }
    tasks = parsed;
  } catch {
    return { migrated: false, migratedImageCount: 0 };
  }

  const db = await openImageDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  let changed = false;
  let migratedImageCount = 0;

  const nextTasks: LocalTaskRecord[] = [];

  for (const task of tasks) {
    const nextTask: LocalTaskRecord = { ...task };

    for (const [imagesKey, refsKey] of [
      ["uploadedImages", "uploadedImageRefs"],
      ["submittedImages", "submittedImageRefs"],
    ] as const) {
      const legacyImages = parseLegacyImages(nextTask[imagesKey]);
      const existingRefs = parseStoredRefs(nextTask[refsKey]);

      if (legacyImages.length === 0) {
        continue;
      }

      const nextRefs = [...existingRefs];
      const nextImages = [...legacyImages];

      for (let i = 0; i < legacyImages.length; i += 1) {
        const image = legacyImages[i];
        if (!image.dataUrl.includes(";base64,")) {
          continue;
        }

        const blob = dataUrlToBlob(image.dataUrl);
        if (!blob) {
          continue;
        }

        const id = crypto.randomUUID();
        await putRecord(store, {
          id,
          name: image.name,
          blob,
          createdAt: Date.now(),
        });

        nextRefs.push({ id, name: image.name });
        nextImages[i] = {
          name: image.name,
          dataUrl: createPlaceholderDataUrl(image.name),
        };

        changed = true;
        migratedImageCount += 1;
      }

      nextTask[imagesKey] = nextImages;
      if (nextRefs.length > 0) {
        nextTask[refsKey] = nextRefs;
      }
    }

    nextTasks.push(nextTask);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  db.close();

  if (changed) {
    localStorage.setItem(ANNOTATOR_TASKS_STORAGE_KEY, JSON.stringify(nextTasks));
  }

  return { migrated: changed, migratedImageCount };
};
