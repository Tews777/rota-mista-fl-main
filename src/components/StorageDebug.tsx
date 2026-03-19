import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StorageDebug() {
  const [showDebug, setShowDebug] = useState(false);

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
        title="Debug localStorage"
      >
        🐛
      </Button>
    );
  }

  const info = getStorageInfo();

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-primary p-4 rounded-lg max-w-sm text-xs z-50">
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
        <div>
          <p className="font-bold text-primary">Chaves localStorage:</p>
          {info.allKeys.length === 0 ? (
            <p className="text-muted-foreground">Vazio</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {info.allKeys.map(key => (
                <li key={key} className="text-muted-foreground break-all">
                  {key}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {info.routeIndexKey && (
          <div>
            <p className="font-bold text-yellow-400">Route Index:</p>
            <p className="text-muted-foreground">Chave: {info.routeIndexKey}</p>
            <p className="text-muted-foreground">Tamanho: {(info.routeIndexSize / 1024).toFixed(2)} KB</p>
            <p className="text-muted-foreground truncate">Preview: {info.routeIndexPreview}</p>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleDownloadStorage}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            📥 Download
          </Button>
          <Button
            onClick={() => {
              localStorage.clear();
              alert("localStorage limpo!");
              window.location.reload();
            }}
            size="sm"
            variant="destructive"
            className="text-xs"
          >
            🗑️ Limpar
          </Button>
        </div>
      </div>
    </div>
  );
}
