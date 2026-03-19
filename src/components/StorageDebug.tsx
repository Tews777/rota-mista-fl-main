import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { clearIndexedDB } from "@/lib/indexedDB";

export function StorageDebug() {
  const [showDebug, setShowDebug] = useState(false);
  const [indexedDBData, setIndexedDBData] = useState<Map<string, { size: number }>>(new Map());

  useEffect(() => {
    // Carregar informações de IndexedDB quando o debug abrir
    if (showDebug) {
      loadIndexedDBInfo();
    }
  }, [showDebug]);

  const loadIndexedDBInfo = async () => {
    try {
      const request = indexedDB.open("rota-mista-db", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("route-indexes", "readonly");
        const store = transaction.objectStore("route-indexes");
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const data = new Map();
          getAllRequest.result.forEach((item: any) => {
            if (item.username && item.data) {
              data.set(item.username, { size: item.data.length });
            }
          });
          setIndexedDBData(data);
        };
      };
    } catch (err) {
      console.error("Erro ao carregar IndexedDB info:", err);
    }
  };

  const getStorageInfo = () => {
    const allKeys = Object.keys(localStorage);
    const routeIndexKey = allKeys.find(k => k.endsWith("_routeIndex"));
    
    return {
      allKeys,
      routeIndexKey,
      routeIndexSize: routeIndexKey ? localStorage.getItem(routeIndexKey)?.length || 0 : 0,
      routeIndexPreview: routeIndexKey ? localStorage.getItem(routeIndexKey)?.substring(0, 100) : null,
    };
  };

  const handleDownloadStorage = () => {
    const info = getStorageInfo();
    const json = JSON.stringify(info, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storage-debug.json";
    a.click();
  };

  if (!showDebug) {
    return (
      <Button
        onClick={() => setShowDebug(true)}
        variant="outline"
        size="sm"
        className="text-xs h-6"
        title="Debug localStorage e IndexedDB"
      >
        🐛
      </Button>
    );
  }

  const info = getStorageInfo();
  const localStorageSize = info.routeIndexSize ? `${(info.routeIndexSize / 1024 / 1024).toFixed(2)} MB` : "Vazio";
  const indexedDBSize = indexedDBData.size > 0 
    ? Array.from(indexedDBData.values()).reduce((sum, v) => sum + v.size, 0) / 1024 / 1024 
    : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-primary p-4 rounded-lg max-w-sm text-xs z-50 max-h-96 overflow-y-auto">
      <div className="space-y-2 font-mono">
        <div className="flex justify-between items-start">
          <span className="font-bold">Storage Debug</span>
          <Button
            onClick={() => setShowDebug(false)}
            variant="ghost"
            size="sm"
            className="h-4 px-2"
          >
            ✕
          </Button>
        </div>

        {/* localStorage Info */}
        <div className="border-t border-primary/30 pt-2">
          <p className="font-bold text-blue-400">📦 localStorage</p>
          {info.allKeys.length === 0 ? (
            <p className="text-muted-foreground">Vazio</p>
          ) : (
            <>
              <ul className="list-disc list-inside space-y-1">
                {info.allKeys.map(key => (
                  <li key={key} className="text-muted-foreground break-all">
                    {key}
                  </li>
                ))}
              </ul>
              {info.routeIndexKey && (
                <>
                  <p className="text-yellow-400 mt-2">Tamanho: {localStorageSize}</p>
                  <p className="text-muted-foreground truncate">Preview: {info.routeIndexPreview}</p>
                </>
              )}
            </>
          )}
        </div>

        {/* IndexedDB Info */}
        <div className="border-t border-primary/30 pt-2">
          <p className="font-bold text-green-400">💾 IndexedDB</p>
          {indexedDBData.size === 0 ? (
            <p className="text-muted-foreground">Vazio</p>
          ) : (
            <>
              {Array.from(indexedDBData.entries()).map(([username, data]) => (
                <div key={username} className="text-muted-foreground">
                  <p>{username}: {(data.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ))}
              <p className="text-green-400 mt-1">Total: {indexedDBSize.toFixed(2)} MB</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 flex-wrap">
          <Button
            onClick={handleDownloadStorage}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            📥 Download
          </Button>
          <Button
            onClick={async () => {
              localStorage.clear();
              await clearIndexedDB();
              alert("Storage limpo!");
              window.location.reload();
            }}
            size="sm"
            variant="destructive"
            className="text-xs"
          >
            🗑️ Limpar
          </Button>
          <Button
            onClick={loadIndexedDBInfo}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            🔄 Recarregar
          </Button>
        </div>
      </div>
    </div>
  );
}
