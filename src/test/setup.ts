import "fake-indexeddb/auto";

// db.ts recusa abrir fora do navegador: simula a existência de `window`.
(globalThis as unknown as { window: typeof globalThis }).window = globalThis;
