// Mode test : résolution du nom de base et suppression de la seule base de test.
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DB_NAME,
  SANDBOX_DB_NAME,
  SANDBOX_FLAG_KEY,
  __resetForTests,
  deleteSandboxDB,
  getDB,
  isSandbox,
  resolveDbName,
  setSandboxFlag,
} from './db';

// Environnement Vitest = node : un localStorage minimal remplace celui du navigateur.
let store: Map<string, string>;
const fakeStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};

beforeEach(async () => {
  await __resetForTests();
  store = new Map();
  vi.stubGlobal('localStorage', fakeStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mode test : nom de la base', () => {
  it('drapeau absent : vraie base', () => {
    expect(isSandbox()).toBe(false);
    expect(resolveDbName()).toBe(DB_NAME);
    expect(DB_NAME).toBe('petits-lecteurs');
  });

  it('drapeau posé : base de test ; retiré : vraie base', () => {
    expect(setSandboxFlag(true)).toBe(true);
    expect(store.get(SANDBOX_FLAG_KEY)).toBe('1');
    expect(resolveDbName()).toBe(SANDBOX_DB_NAME);
    setSandboxFlag(false);
    expect(resolveDbName()).toBe(DB_NAME);
  });

  it('localStorage qui lève : vraie base, sans exception', () => {
    const boom = () => {
      throw new Error('bloqué');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
    expect(isSandbox()).toBe(false);
    expect(resolveDbName()).toBe(DB_NAME);
    expect(setSandboxFlag(true)).toBe(false);
  });

  it('getDB ouvre la base de test en mode test et laisse la vraie intacte', async () => {
    setSandboxFlag(true);
    const db = await getDB();
    expect(db.name).toBe(SANDBOX_DB_NAME);
    await db.put('profiles', { id: 'p1' } as never);
    await deleteSandboxDB();
    const names = (await indexedDB.databases()).map((d) => d.name);
    expect(names).not.toContain(SANDBOX_DB_NAME);
    expect(names).not.toContain(DB_NAME);
  });

  it('deleteSandboxDB ne touche pas la vraie base', async () => {
    const real = await openDB(DB_NAME, 1, { upgrade: (d) => void d.createObjectStore('x') });
    real.close();
    await deleteSandboxDB();
    expect((await indexedDB.databases()).map((d) => d.name)).toContain(DB_NAME);
  });
});
