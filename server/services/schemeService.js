// Minimal READ-ONLY scheme access, added now because the Applications list
// needs a scheme filter dropdown. Full CRUD (create/edit/activate/dynamic
// fields) is Phase 7 - this file will grow there, not be replaced.
const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');

async function listSchemes({ activeOnly = false } = {}) {
  let query = db().collection(COLLECTIONS.SCHEMES).orderBy('name', 'asc');
  if (activeOnly) query = query.where('status', '==', 'ACTIVE');
  const snapshot = await query.get();
  return toCollectionArray(snapshot);
}

async function getSchemeById(schemeId) {
  const doc = await db().collection(COLLECTIONS.SCHEMES).doc(schemeId).get();
  return toDocObject(doc);
}

module.exports = { listSchemes, getSchemeById };
