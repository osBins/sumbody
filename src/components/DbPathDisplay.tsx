import { useState, useEffect } from "react"
import { getDbPath } from "@/lib/tauri-commands"

export function DbPathDisplay() {
  const [dbPath, setDbPath] = useState<string>("")

  useEffect(() => {
    getDbPath()
      .then(setDbPath)
      .catch(() => setDbPath("Unable to retrieve database path"))
  }, [])

  if (!dbPath) return null

  return (
    <span className="text-xs text-muted-foreground truncate" title={dbPath}>
      Database: {dbPath}
    </span>
  )
}
