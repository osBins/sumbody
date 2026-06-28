import { useState, useCallback } from "react";
import type { DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { updateMember } from "@/lib/tauri-commands";
import { useMembers } from "@/hooks/useMembers";
import { useFilters } from "@/hooks/useFilters";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { useImport } from "@/hooks/useImport";
import { MemberTable } from "@/components/MemberTable";
import { FilterPanel } from "@/components/FilterPanel";
import { SearchBar } from "@/components/SearchBar";
import { ImportProgress } from "@/components/ImportProgress";
import { BirthdayTray } from "@/components/BirthdayTray";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ExportButton } from "@/components/ExportButton";
import { EmailAllButton } from "@/components/EmailAllButton";
import { ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen, Upload } from "lucide-react";
import type { MemberRecord } from "@/types/member";

const ZOOM_LEVELS = [75, 80, 90, 100, 110, 125, 150];

export function Dashboard() {
  const { members, loading, refetch } = useMembers();
  const { filters, setFilter, resetFilters, applyFilters } = useFilters();
  const filteredMembers = applyFilters(members, filters);
  const { query, setQuery, results: displayMembers } = useFuzzySearch(filteredMembers);
  const { isImporting, progress, result: importResult, pending, prepareImport, confirmImport, cancelImport } = useImport(refetch);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ memberno: string; name: string } | null>(null);
  const [zoomIndex, setZoomIndex] = useState(ZOOM_LEVELS.indexOf(100));
  const zoom = ZOOM_LEVELS[zoomIndex];
  const [filterOpen, setFilterOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scrollToMemberno, setScrollToMemberno] = useState<string | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  const handleScrollToMember = (memberno: string) => {
    setScrollToMemberno(memberno);
    setScrollTrigger((t) => t + 1);
  };

  const zoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1));
  const zoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));

  // File input ref for Import button
  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) prepareImport(file);
    };
    input.click();
  };

  // Global drag-and-drop handlers
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) prepareImport(file);
  }, [prepareImport]);

  const handleUpdate = async (memberno: string, record: MemberRecord) => {
    try {
      await updateMember(memberno, record);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ variant: "destructive", title: "Update failed", description: message });
      await refetch();
    }
  };

  const handleDelete = (memberno: string, name: string) => {
    setDeleteTarget({ memberno, name });
  };

  const handleDeleteConfirm = () => {
    setDeleteTarget(null);
    refetch();
  };

  return (
    <div
      className="flex flex-col h-screen bg-background text-foreground relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-screen drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 border-4 border-dashed border-primary rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-12 w-12" />
            <span className="text-lg font-medium">Drop file to import</span>
          </div>
        </div>
      )}

      {/* Accent strip */}
      <div className="h-1 bg-[hsl(var(--primary))]" />

      {/* Top Toolbar */}
      <header className="flex items-center gap-2 md:gap-4 border-b px-4 md:px-6 py-3 flex-wrap bg-card">
        <h1 className="text-xl font-bold whitespace-nowrap text-[hsl(var(--primary))]">sumbody</h1>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {displayMembers.length === members.length
            ? `${members.length} members`
            : `${displayMembers.length} of ${members.length} members`}
        </span>
        <div className="flex-1">
          <SearchBar query={query} setQuery={setQuery} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors disabled:opacity-50"
            title="Import .xlsx or .csv file"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Import
          </button>
          <ExportButton members={displayMembers} />
          <EmailAllButton members={displayMembers} />
          <button
            type="button"
            onClick={() => {
              const numbers = displayMembers.map((m) => m.MOBILENO).filter(Boolean).join(", ");
              navigator.clipboard.writeText(numbers);
              toast({ title: "Copied", description: `${displayMembers.filter((m) => m.MOBILENO).length} mobile numbers copied to clipboard` });
            }}
            disabled={displayMembers.length === 0}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            title="Copy all mobile numbers from current view"
          >
            Copy Numbers
          </button>
          <button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Add new member"
          >
            +
          </button>
          <div className="flex items-center gap-1 ml-2 border-l pl-2">
            <button onClick={zoomOut} disabled={zoomIndex === 0} className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30" title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground w-8 text-center">{zoom}%</span>
            <button onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30" title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Zoomable content area */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ zoom: `${zoom}%` }}>
        {/* Import progress + Birthday */}
        <div className="px-6 pt-2 space-y-2">
          <ImportProgress isImporting={isImporting} progress={progress} result={importResult} />
          <BirthdayTray members={members} onScrollToMember={handleScrollToMember} />
          {displayMembers.length !== members.length && (
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                Showing {displayMembers.length} of {members.length} members
              </span>
            </div>
          )}
        </div>

        {/* Main content area: filter panel + table */}
        <div className="flex flex-1 overflow-hidden px-6 py-3 gap-4">
          {!filterOpen && (
            <button type="button" onClick={() => setFilterOpen(true)} className="shrink-0 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors self-start" title="Show filters">
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          )}

          <aside className={`shrink-0 overflow-hidden ${filterOpen ? "w-56 lg:w-64" : "w-0"}`}>
            <div className="w-56 lg:w-64 h-full overflow-y-auto">
              <Card className="min-h-full">
                <CardHeader className="pb-3 sticky top-0 z-10 bg-[hsl(350,100%,97%)] border-b border-border rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Filters</CardTitle>
                    <button type="button" onClick={() => setFilterOpen(false)} className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Hide filters">
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <FilterPanel filters={filters} setFilter={setFilter} resetFilters={resetFilters} members={members} />
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="flex-1 overflow-auto">
            <Card className="h-full">
              <CardContent className="p-0 h-full overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Loading members...</p>
                    </div>
                  </div>
                ) : (
                  <MemberTable members={displayMembers} onDelete={handleDelete} onUpdate={handleUpdate} scrollToMemberno={scrollToMemberno} scrollTrigger={scrollTrigger} />
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Dialogs */}
      <AddMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={refetch} />
      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          memberno={deleteTarget.memberno}
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Import Confirmation Dialog */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Confirm Import</h3>
            <p className="text-sm text-muted-foreground mb-4">
              File: <span className="font-medium text-foreground">{pending.file.name}</span>
            </p>
            <div className="space-y-1 text-sm mb-6">
              <p><span className="font-medium">{pending.parseResult.valid.length}</span> valid records found</p>
              <p className="text-green-600"><span className="font-medium">{pending.newCount}</span> new records will be added</p>
              {pending.updateCount > 0 && (
                <p className="text-amber-600"><span className="font-medium">{pending.updateCount}</span> existing records will be overwritten</p>
              )}
              {pending.parseResult.skipped > 0 && (
                <p className="text-muted-foreground"><span className="font-medium">{pending.parseResult.skipped}</span> rows will be skipped (missing Member No.)</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={cancelImport} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                Cancel
              </button>
              <button onClick={confirmImport} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Import {pending.parseResult.valid.length} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
