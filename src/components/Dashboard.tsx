import { useState, useCallback, useMemo } from "react";
import type { DragEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { updateMember, deleteMember } from "@/lib/tauri-commands";
import { useMembers } from "@/hooks/useMembers";
import { useCallLogs } from "@/hooks/useCallLogs";
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
import { CallLogInline } from "@/components/CallHistoryPanel";
import { ZoomIn, ZoomOut, PanelLeftClose, Upload, Phone, Users, Filter } from "lucide-react";
import type { MemberRecord } from "@/types/member";

const ZOOM_LEVELS = [75, 80, 90, 100, 110, 125, 150];

export function Dashboard() {
  const { members, loading, refetch } = useMembers();
  const { lastCallMap, refetch: refetchCallLogs } = useCallLogs();
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
  const [activeTab, setActiveTab] = useState<"members" | "callLog">("members");

  // Build a map of memberno -> member name for use in CallHistoryPanel
  const memberNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.MEMBERNO] = m.NAME || m.MEMBERNO;
    }
    return map;
  }, [members]);

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

  const handleBulkDelete = async (membernos: string[]) => {
    if (!confirm(`Delete ${membernos.length} selected members? This cannot be undone.`)) return;
    try {
      for (const memberno of membernos) {
        await deleteMember(memberno);
      }
      toast({ title: "Deleted", description: `${membernos.length} members deleted.` });
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ variant: "destructive", title: "Delete failed", description: message });
      await refetch();
    }
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

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b bg-card px-4 md:px-6">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "members" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
        >
          <Users className="h-4 w-4" />
          Members
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("callLog")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "callLog" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}
        >
          <Phone className="h-4 w-4" />
          Call Log
        </button>
      </div>

      {/* Zoomable content area */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ zoom: `${zoom}%` }}>
        {activeTab === "members" && (
          <div className="px-6 pt-2 space-y-2">
            <ImportProgress isImporting={isImporting} progress={progress} result={importResult} />
            <BirthdayTray members={members} onScrollToMember={handleScrollToMember} />
            {displayMembers.length !== members.length && (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  Showing {displayMembers.length} of {members.length} members
                </span>
                <button
                  type="button"
                  onClick={() => { resetFilters(); setQuery(""); }}
                  className="text-xs text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main content area: filter panel + content */}
        <div className="flex flex-1 overflow-hidden px-6 py-3 gap-4">
          {!filterOpen && (
            <button type="button" onClick={() => setFilterOpen(true)} className="shrink-0 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors self-start" title="Show filters">
              <Filter className="h-5 w-5" />
            </button>
          )}

          <aside className={`shrink-0 overflow-hidden ${filterOpen ? "w-56 lg:w-64" : "w-0"}`}>
            <div className="w-56 lg:w-64 h-full overflow-y-auto">
              <Card className="min-h-full">
                <CardHeader className="pb-3 sticky top-0 z-10 bg-[hsl(350,100%,97%)] border-b border-border rounded-t-lg cursor-pointer hover:bg-[hsl(350,100%,95%)] transition-colors" onClick={() => setFilterOpen(false)}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-base font-semibold">
                      <Filter className="h-4 w-4" />
                      Filters
                    </span>
                    <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <FilterPanel filters={filters} setFilter={setFilter} resetFilters={resetFilters} members={members} />
                </CardContent>
              </Card>
            </div>
          </aside>

          <main className="flex-1 overflow-auto">
            {activeTab === "callLog" ? (
              <Card className="h-full">
                <CardContent className="p-0 h-full overflow-auto">
                  <CallLogInline memberNames={memberNames} filteredMembernos={displayMembers.map(m => m.MEMBERNO)} />
                </CardContent>
              </Card>
            ) : (
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
                    <MemberTable members={displayMembers} onDelete={handleDelete} onBulkDelete={handleBulkDelete} onUpdate={handleUpdate} scrollToMemberno={scrollToMemberno} scrollTrigger={scrollTrigger} lastCallMap={lastCallMap} onCallLogChange={refetchCallLogs} memberNames={memberNames} />
                  )}
                </CardContent>
              </Card>
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={cancelImport}>
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={cancelImport}
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
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
