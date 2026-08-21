// Started as READ-ONLY in Phase 4 (Applications needed a filter dropdown).
// This is that same file, extended with the full CRUD promised then - not
// a rewrite.
const { db, COLLECTIONS, toCollectionArray, toDocObject } = require('../firebase/firestore');
const { logAction } = require('./auditService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const ApiError = require('../utils/ApiError');

async function listSchemes({ activeOnly = false } = {}) {
  let query = db().collection(COLLECTIONS.SCHEMES).orderBy('name', 'asc');
  if (activeOnly) query = query.where('status', '==', 'ACTIVE');
  const snapshot = await query.get();
  return toCollectionArray(snapshot);
}

async function getSchemeById(schemeId) {
  const doc = await db().collection(COLLECTIONS.SCHEMES).doc(schemeId).get();
  const scheme = toDocObject(doc);
  if (!scheme) throw ApiError.notFound('Scheme not found.');
  return scheme;
}

/**
 * Creates a new scheme. New schemes default to ACTIVE - the spec doesn't
 * specify a default, but making an admin flip a second toggle just to make
 * a scheme they just filled out actually usable would be a strange default,
 * and INACTIVE-by-default has no support in the spec either. Documented
 * here as the one place this assumption lives.
 */
async function createScheme(payload, actor) {
  const now = new Date();
  const scheme = { ...payload, status: 'ACTIVE', createdAt: now, updatedAt: now };
  const ref = await db().collection(COLLECTIONS.SCHEMES).add(scheme);

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.SCHEME_CREATED,
    entityType: 'scheme',
    entityId: ref.id,
    metadata: { name: scheme.name },
  });

  return { id: ref.id, ...scheme };
}

/**
 * Updates a scheme. Logs one SCHEME_UPDATED entry summarizing which fields
 * changed, and - since price changes are especially consequential for a
 * paid service - an additional dedicated PRICE_UPDATED entry with the
 * old/new amount whenever price specifically changes, matching the
 * separate PRICE_UPDATED action the spec calls out (Section 33).
 */
async function updateScheme(schemeId, updates, actor) {
  const ref = db().collection(COLLECTIONS.SCHEMES).doc(schemeId);
  const existingDoc = await ref.get();
  if (!existingDoc.exists) throw ApiError.notFound('Scheme not found.');

  const existing = existingDoc.data();
  const changedFields = Object.keys(updates).filter(
    (field) => JSON.stringify(existing[field]) !== JSON.stringify(updates[field])
  );

  if (changedFields.length === 0) {
    return { id: schemeId, ...existing };
  }

  await ref.update({ ...updates, updatedAt: new Date() });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: AUDIT_ACTIONS.SCHEME_UPDATED,
    entityType: 'scheme',
    entityId: schemeId,
    metadata: { fieldsChanged: changedFields },
  });

  if (changedFields.includes('price')) {
    await logAction({
      actorId: actor.id,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.PRICE_UPDATED,
      entityType: 'scheme',
      entityId: schemeId,
      fieldChanged: 'price',
      oldValue: existing.price,
      newValue: updates.price,
    });
  }

  const updatedDoc = await ref.get();
  return { id: schemeId, ...updatedDoc.data() };
}

async function updateSchemeStatus(schemeId, status, actor) {
  const ref = db().collection(COLLECTIONS.SCHEMES).doc(schemeId);
  const existingDoc = await ref.get();
  if (!existingDoc.exists) throw ApiError.notFound('Scheme not found.');

  const existing = existingDoc.data();
  if (existing.status === status) {
    return { id: schemeId, ...existing };
  }

  await ref.update({ status, updatedAt: new Date() });

  await logAction({
    actorId: actor.id,
    actorRole: actor.role,
    action: status === 'ACTIVE' ? AUDIT_ACTIONS.SCHEME_ACTIVATED : AUDIT_ACTIONS.SCHEME_DEACTIVATED,
    entityType: 'scheme',
    entityId: schemeId,
    metadata: { name: existing.name },
  });

  const updatedDoc = await ref.get();
  return { id: schemeId, ...updatedDoc.data() };
}

module.exports = { listSchemes, getSchemeById, createScheme, updateScheme, updateSchemeStatus };
