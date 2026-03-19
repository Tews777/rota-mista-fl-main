// IndexedDB service para persistência de arquivos grandes
const DB_NAME = "rota-mista-db";
const STORE_NAME = "route-indexes";
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "username" });
      }
    };
  });
}

export async function saveToIndexedDB(username: string, data: string): Promise<boolean> {
  try {
    const database = await initDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        username,
        data,
        timestamp: new Date().getTime(),
      });

      transaction.oncomplete = () => {
        console.log("✅ Arquivo salvo em IndexedDB");
        resolve(true);
      };

      transaction.onerror = () => {
        console.error("❌ Erro ao salvar em IndexedDB");
        resolve(false);
      };
    });
  } catch (err) {
    console.error("❌ Erro ao acessar IndexedDB:", err);
    return false;
  }
}

export async function loadFromIndexedDB(username: string): Promise<string | null> {
  try {
    const database = await initDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(username);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          console.log("✅ Arquivo carregado de IndexedDB");
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("❌ Erro ao carregar de IndexedDB");
        resolve(null);
      };
    });
  } catch (err) {
    console.error("❌ Erro ao acessar IndexedDB:", err);
    return null;
  }
}

export async function removeFromIndexedDB(username: string): Promise<boolean> {
  try {
    const database = await initDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(username);

      transaction.oncomplete = () => {
        console.log("✅ Arquivo removido de IndexedDB");
        resolve(true);
      };

      transaction.onerror = () => {
        console.error("❌ Erro ao remover de IndexedDB");
        resolve(false);
      };
    });
  } catch (err) {
    console.error("❌ Erro ao acessar IndexedDB:", err);
    return false;
  }
}

export async function clearIndexedDB(): Promise<boolean> {
  try {
    const database = await initDB();
    
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      transaction.oncomplete = () => {
        console.log("✅ IndexedDB limpo");
        resolve(true);
      };

      transaction.onerror = () => {
        console.error("❌ Erro ao limpar IndexedDB");
        resolve(false);
      };
    });
  } catch (err) {
    console.error("❌ Erro ao acessar IndexedDB:", err);
    return false;
  }
}
