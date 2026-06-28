import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { exportToCSV } from "@/lib/csv"
import type { MemberRecord } from "@/types/member"

interface ExportButtonProps {
  members: MemberRecord[]
  disabled?: boolean
}

export function ExportButton({ members, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const isDisabled = disabled || members.length === 0

  const handleExport = async () => {
    if (isDisabled) return
    setExporting(true)
    try {
      await exportToCSV(members)
      toast({
        title: "Export successful",
        description: `Exported ${members.length} record${members.length !== 1 ? "s" : ""} to CSV.`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isDisabled || exporting}
      title={members.length === 0 ? "No data to export" : "Export filtered view to CSV"}
      className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
    >
      <Download className="h-4 w-4 mr-2" />
      {exporting ? "Exporting…" : "Export CSV"}
    </Button>
  )
}
