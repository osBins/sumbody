import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { initDatabase } from "@/lib/tauri-commands";
import { Dashboard } from "@/components/Dashboard";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";

function App() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setInitialized(true))
      .catch((err: Error) => setError(err.message));
  }, []);

  // Check for updates silently on launch
  useEffect(() => {
    if (!initialized) return;
    check()
      .then((update) => {
        if (update) {
          toast({
            title: "Update available",
            description: `Version ${update.version} is available. Restart the app after downloading.`,
          });
          update.downloadAndInstall();
        }
      })
      .catch(() => {});
  }, [initialized]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="max-w-md w-full rounded-lg border bg-card p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Database Error
          </h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  );
}

export default App;
