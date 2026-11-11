const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '../../storage');

function resolveStorageDirectory(storageDir) {
  return path.resolve(storageDir || process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR);
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function removeStoredFile(storageDir, filename) {
  try {
    await fs.unlink(path.join(storageDir, filename));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function createDocumentsRepository(storageDir) {
  const resolvedStorageDir = resolveStorageDirectory(storageDir);
  const documents = new Map();

  return {
    storageDir: resolvedStorageDir,

    async save(document) {
      try {
        documents.set(document.id, document);
        return toPublicDocument(document);
      } catch (error) {
        documents.delete(document.id);
        await removeStoredFile(resolvedStorageDir, document.filename).catch(() => {});
        throw error;
      }
    },

    list() {
      return Array.from(documents.values())
        .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
        .map(toPublicDocument);
    },

    async findFileById(id) {
      const document = documents.get(id);
      if (!document) {
        return null;
      }

      const filePath = path.join(resolvedStorageDir, document.filename);
      try {
        await fs.access(filePath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return null;
        }
        throw error;
      }

      return { document: toPublicDocument(document), filePath };
    },

  };
}

module.exports = { createDocumentsRepository };