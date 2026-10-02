// نسخة مبسطة من Firestore في الذاكرة للاختبارات: تكفي للاستعلامات والعمليات اللي يستخدمها الخادم.
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

class Sentinel { constructor(kind, value) { this.kind = kind; this.value = value; } }
export const FieldValue = {
  increment: (n) => new Sentinel("inc", n),
  arrayUnion: (...v) => new Sentinel("union", v),
  serverTimestamp: () => new Sentinel("now"),
  delete: () => new Sentinel("del"),
};

const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
function resolve(current, value) {
  if (value instanceof Sentinel) {
    if (value.kind === "inc") return (Number(current) || 0) + value.value;
    if (value.kind === "union") return [...(Array.isArray(current) ? current : []), ...clone(value.value)];
    if (value.kind === "now") return Date.now();
  }
  return value;
}
function applyPatch(target, patch, deep) {
  const out = { ...(target || {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v instanceof Sentinel && v.kind === "del") { delete out[k]; continue; }
    if (deep && v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Sentinel) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) out[k] = applyPatch(out[k], v, true);
    else out[k] = clone(resolve(out[k], v));
  }
  return out;
}

let autoId = 0;
export class FakeDb {
  constructor() { this.data = new Map(); }
  settings() {}
  collection(name) { return new Query(this, name, []); }
  batch() { return new Batch(this); }
  async runTransaction(fn) {
    const tx = new Batch(this);
    tx.get = async (refOrQuery) => refOrQuery.get();
    const out = await fn(tx);
    await tx.commit();
    return out;
  }
  _write(path, op, data, opts) {
    const cur = this.data.get(path);
    if (op === "delete") return this.data.delete(path);
    if (op === "create" && cur) throw new Error(`already exists: ${path}`);
    if (op === "update" && !cur) throw new Error(`not found: ${path}`);
    const next = op === "set" && !opts?.merge ? applyPatch({}, data, false) : applyPatch(cur, data, op === "set");
    this.data.set(path, next);
  }
}

class DocRef {
  constructor(db, col, id) { this.db = db; this.col = col; this.id = id; this.path = `${col}/${id}`; this.ref = this; }
  async get() { const d = this.db.data.get(this.path); return { id: this.id, exists: Boolean(d), data: () => clone(d), ref: this }; }
  async set(data, opts) { this.db._write(this.path, "set", data, opts); }
  async update(data) { this.db._write(this.path, "update", data); }
  async delete() { this.db._write(this.path, "delete"); }
  async create(data) { try { this.db._write(this.path, "create", data); } catch (e) { throw Object.assign(e, { code: 6 }); } }
}

class Query {
  constructor(db, col, filters, order = null, lim = null) { this.db = db; this.col = col; this.filters = filters; this.order = order; this.lim = lim; }
  doc(id) { return new DocRef(this.db, this.col, id || `auto${++autoId}`); }
  async add(data) { const r = this.doc(); await r.set(data); return r; }
  where(f, op, v) { return new Query(this.db, this.col, [...this.filters, [f, op, v]], this.order, this.lim); }
  orderBy(f, dir = "asc") { return new Query(this.db, this.col, this.filters, [f, dir], this.lim); }
  limit(n) { return new Query(this.db, this.col, this.filters, this.order, n); }
  _rows() {
    let rows = [...this.db.data.entries()].filter(([p]) => p.startsWith(`${this.col}/`) && p.split("/").length === 2).map(([p, d]) => ({ id: p.split("/")[1], d }));
    for (const [f, op, v] of this.filters) rows = rows.filter(({ d }) => {
      const x = getPath(d, f);
      if (op === "==") return (x ?? null) === v;
      if (op === ">") return x !== undefined && x !== null && x > v;
      if (op === "<") return x !== undefined && x !== null && x < v;
      if (op === "in") return v.includes(x);
      throw new Error(`op ${op}`);
    });
    if (this.order) { const [f, dir] = this.order; rows.sort((a, b) => (getPath(a.d, f) > getPath(b.d, f) ? 1 : -1) * (dir === "desc" ? -1 : 1)); }
    if (this.lim) rows = rows.slice(0, this.lim);
    return rows;
  }
  async get() {
    const docs = this._rows().map(({ id, d }) => ({ id, exists: true, data: () => clone(d), ref: new DocRef(this.db, this.col, id) }));
    return { docs, empty: !docs.length, size: docs.length };
  }
  count() { return { get: async () => ({ data: () => ({ count: this._rows().length }) }) }; }
}

class Batch {
  constructor(db) { this.db = db; this.ops = []; }
  set(ref, data, opts) { this.ops.push([ref.path, "set", data, opts]); return this; }
  update(ref, data) { this.ops.push([ref.path, "update", data]); return this; }
  create(ref, data) { this.ops.push([ref.path, "create", data]); return this; }
  delete(ref) { this.ops.push([ref.path, "delete"]); return this; }
  async commit() { for (const [p, op, d, o] of this.ops) this.db._write(p, op, d, o); this.ops = []; }
}
