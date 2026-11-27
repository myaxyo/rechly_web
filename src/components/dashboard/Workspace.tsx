"use client";

import DecimalInput from "@/components/DecimalInput";

import { useEffect, useState } from "react";
import { Loader2, Plus, Download, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import type { BusinessCollection, BusinessData, BusinessDocument, BusinessTask } from "@/lib/workspace/domain";
import { WorkspaceLinks } from "@/components/workspace/common";
import TaskBoard from "@/components/workspace/TaskBoard";

type RecordData = BusinessData[BusinessCollection][number];
type Snapshot = { data: BusinessData; clients: { id: string; name: string }[] };
type FormValues = { name: string; title: string; description: string; client_id: string; project_id: string; status: string; due_date: string; budget: number | null; assignee: string; priority: string; kind: string; recipient: string; body: string };
const emptyValues: FormValues = { name: "", title: "", description: "", client_id: "", project_id: "", status: "", due_date: "", budget: 0, assignee: "", priority: "normal", kind: "note", recipient: "", body: "" };
const initial: BusinessData = { projects: [], tasks: [], documents: [] };
const statuses = { projects: ["active", "paused", "done"], tasks: ["todo", "doing", "done"], documents: ["letter", "minutes", "note"] };

function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Workspace() {
    const { language } = useLanguage();
    const l = (de: string, en: string) => language === "de" ? de : en;
    const [snapshot, setSnapshot] = useState<Snapshot>({ data: initial, clients: [] });
    const [key, setKey] = useState<BusinessCollection>("projects");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [board, setBoard] = useState(true);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [editorError, setEditorError] = useState("");
    const [editing, setEditing] = useState<{ id?: string } | null>(null);
    const [dirty, setDirty] = useState(false);
    const [values, setValues] = useState<FormValues>(emptyValues);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [discardOpen, setDiscardOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { data, clients } = snapshot;
    const labels: Record<string, string> = {
        projects: l("Projekte", "Projects"), tasks: l("Aufgaben", "Tasks"), documents: l("Dokumente", "Documents"),
        active: l("Aktiv", "Active"), paused: l("Pausiert", "Paused"), done: l("Erledigt", "Done"),
        todo: l("Offen", "To do"), doing: l("In Arbeit", "In progress"),
        letter: l("Brief", "Letter"), minutes: l("Protokoll", "Minutes"), note: l("Notiz", "Note"),
    };
    const reqMsg = l("Bitte ausfüllen.", "Please fill in this field.");
    const set = (patch: Partial<FormValues>) => { setValues(v => ({ ...v, ...patch })); setDirty(true); };

    async function load() {
        setLoading(true);
        try {
            const response = await fetch("/api/workspace", { cache: "no-store" });
            if (!response.ok) throw new Error(l("Arbeitsbereich nicht verfügbar. Bitte erneut versuchen oder neu anmelden.", "Workspace unavailable. Please retry or sign in again."));
            setSnapshot(await response.json()); setReady(true); setError("");
        } catch (error) { setError((error as Error).message); }
        finally { setLoading(false); }
    }
    useEffect(() => {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab === "tasks" || tab === "documents" || tab === "projects") setKey(tab);
        void load(); /* Fetch once; language switches retain the editor. */
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (!dirty) return;
        const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
        window.addEventListener("beforeunload", prevent);
        return () => window.removeEventListener("beforeunload", prevent);
    }, [dirty]);

    function close() {
        if (busy) return;
        if (dirty) setDiscardOpen(true);
        else { setEditing(null); setDirty(false); }
    }
    function edit(record?: RecordData) {
        if (record) {
            const r = record as unknown as Record<string, unknown>;
            setValues({ ...emptyValues, name: String(r.name ?? ""), title: String(r.title ?? ""), description: String(r.description ?? ""), client_id: String(r.client_id ?? ""), project_id: String(r.project_id ?? ""), status: String(r.status ?? ""), due_date: String(r.due_date ?? ""), budget: typeof r.budget === "number" ? r.budget : 0, assignee: String(r.assignee ?? ""), priority: String(r.priority ?? "normal"), kind: String(r.kind ?? "note"), recipient: String(r.recipient ?? ""), body: String(r.body ?? "") });
        } else {
            setValues(key === "projects"
                ? { ...emptyValues, name: "", description: "", client_id: "", status: "active", due_date: "", budget: 0 }
                : key === "tasks" ? { ...emptyValues, title: "", project_id: "", assignee: "", status: "todo", priority: "normal", due_date: "" }
                : { ...emptyValues, title: "", kind: "note", recipient: "", body: "", project_id: "" });
        }
        setEditing(record || {}); setDirty(false); setEditorError(""); setFieldErrors({});
    }
    async function mutate(body: object) {
        const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collection: key, ...body }) });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(language === "de" ? result.error : "Could not save. Check your fields and linked records, then retry.");
        }
    }
    function payload(): object {
        if (key === "projects") return { name: values.name, description: values.description, client_id: values.client_id, status: values.status, due_date: values.due_date, budget: values.budget };
        if (key === "tasks") return { title: values.title, project_id: values.project_id, assignee: values.assignee, status: values.status, priority: values.priority, due_date: values.due_date };
        return { title: values.title, kind: values.kind, recipient: values.recipient, body: values.body, project_id: values.project_id };
    }
    function validate() { const e: Record<string, string> = {}; const titleVal = key === "projects" ? values.name : values.title; if (!titleVal.trim()) e.title = reqMsg; if (key === "projects" && (values.budget === null || values.budget === undefined)) e.budget = reqMsg; setFieldErrors(e); return !Object.keys(e).length; }
    async function save() {
        if (!validate()) return;
        setBusy(true); setEditorError("");
        try {
            await mutate({ action: "save", record: { ...payload(), ...(editing?.id ? { id: editing.id } : {}) } });
            setEditing(null); setDirty(false); await load();
        } catch (error) { setEditorError((error as Error).message); }
        finally { setBusy(false); }
    }
    async function remove(id: string) {
        setBusy(true);
        try { await mutate({ action: "delete", id }); await load(); }
        catch (error) { setError((error as Error).message); }
        finally { setBusy(false); }
    }
    async function exportPdf(id: string) {
        setBusy(true);
        try {
            const response = await fetch(`/api/workspace?documentId=${encodeURIComponent(id)}`);
            if (!response.ok) throw new Error(l("PDF konnte nicht erstellt werden.", "Could not create PDF."));
            download(await response.blob(), "document.pdf");
        } catch (error) { setError((error as Error).message); }
        finally { setBusy(false); }
    }
    function template(kind: string) {
        setValues(v => ({ ...v, kind }));
        if (values.body?.trim()) return;
        setValues(v => ({ ...v, kind, body: kind === "letter" ? l("Sehr geehrte Damen und Herren,\n\n\n\nMit freundlichen Grüßen", "Dear Sir or Madam,\n\n\n\nKind regards") : kind === "minutes" ? l("Datum:\nTeilnehmende:\n\nBesprochene Themen:\n\nEntscheidungen:\n\nNächste Schritte:", "Date:\nAttendees:\n\nDiscussion:\n\nDecisions:\n\nNext steps:") : "" }));
        setDirty(true);
    }
    const rows = data[key].filter(record => {
        const status = "status" in record ? record.status : record.kind;
        return (filter === "all" || status === filter) && Object.values(record).some(value => String(value).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    });
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const money = (value: number) => new Intl.NumberFormat(language === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" }).format(value);
    return <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{l("Ungespeicherte Änderungen verwerfen?", "Discard unsaved changes?")}</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{l("Weiter bearbeiten", "Keep editing")}</AlertDialogCancel><AlertDialogAction onClick={() => { setDiscardOpen(false); setEditing(null); setDirty(false); }}>{l("Verwerfen", "Discard")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{l("Eintrag endgültig löschen?", "Permanently delete this record?")}</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{l("Abbrechen", "Cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => { const id = deleteId; setDeleteId(null); if (id) void remove(id); }}>{l("Löschen", "Delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <WorkspaceLinks />
        <div className="flex w-full flex-col gap-6">
            <div><h2 className="text-2xl font-semibold">{l("Arbeitsbereich", "Workspace")}</h2>
                <p className="text-sm text-muted-foreground">{l("Projekte planen, Aufgaben organisieren und Geschäftsdokumente schreiben – nur wenn Sie es brauchen.", "Plan projects, organize tasks and write business documents whenever you need them.")}</p>
                <div className="flex flex-wrap gap-2"><Badge variant="secondary">{data.projects.filter(p => p.status === "active").length} {l("aktive Projekte", "active projects")}</Badge><Badge variant="secondary">{data.tasks.filter(t => t.status !== "done").length} {l("offene Aufgaben", "open tasks")}</Badge><Badge variant="secondary">{data.documents.length} {labels.documents}</Badge></div>
            </div>
            {error && <Alert variant="destructive"><AlertTitle>{error}</AlertTitle><AlertDescription><Button onClick={load} disabled={loading} size="sm" className="mt-2">{loading && <Loader2 className="animate-spin" />}{l("Erneut versuchen", "Retry")}</Button></AlertDescription></Alert>}
            <Card><CardContent>
                <Tabs value={key} onValueChange={value => { setKey(value as BusinessCollection); setSearch(""); setFilter("all"); }}><TabsList>{(["projects", "tasks", "documents"] as const).map(value => <TabsTrigger key={value} value={value} disabled={busy}>{labels[value]}</TabsTrigger>)}</TabsList></Tabs>
                <div className="mb-6 flex w-full flex-wrap items-center gap-2">
                    <div className="relative"><Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" aria-hidden /><Input aria-label={l("Arbeitsbereich durchsuchen", "Search workspace")} placeholder={l("Suchen …", "Search …")} value={search} onChange={event => setSearch(event.target.value)} style={{ width: 230 }} className="pl-8" /></div>
                    <Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label={l("Status filtern", "Filter status")} style={{ minWidth: 145 }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{l("Alle", "All")}</SelectItem>{statuses[key].map(value => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select>
                    {key === "tasks" && <div className="inline-flex rounded-md bg-muted p-1"><button type="button" aria-pressed={board} className={board ? "rounded-sm bg-background px-3 py-1 text-sm shadow" : "px-3 py-1 text-sm"} onClick={() => setBoard(true)}>{l("Aufgabenboard", "Task board")}</button><button type="button" aria-pressed={!board} className={!board ? "rounded-sm bg-background px-3 py-1 text-sm shadow" : "px-3 py-1 text-sm"} onClick={() => setBoard(false)}>{l("Karten", "Cards")}</button></div>}
                    <Button disabled={!ready || loading || busy} onClick={() => edit()}><Plus aria-hidden />{l("Neu anlegen", "Create new")}</Button>
                    <Button asChild variant="outline"><a href="/api/workspace/backup" aria-disabled={!ready || loading}><Download aria-hidden />{l("Arbeitsbereich exportieren", "Export workspace")}</a></Button>
                </div>
                {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : !rows.length ? <div className="py-10 text-center text-sm text-muted-foreground">{search || filter !== "all" ? l("Keine passenden Einträge.", "No matching records.") : l("Hier ist Platz für Ihre Arbeit. Erstellen Sie den ersten Eintrag.", "Room for your work. Create your first record.")}</div> : key === "tasks" && board ? <TaskBoard tasks={rows as BusinessTask[]} projects={data.projects} busy={busy} edit={edit} change={async (task,status) => { setBusy(true); try { await mutate({ action: "save", record: { ...task, status } }); await load(); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }} /> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {rows.map(record => {
                            const title = "name" in record ? record.name : record.title;
                            const status = "status" in record ? record.status : record.kind;
                            const project = "project_id" in record ? data.projects.find(p => p.id === record.project_id) : undefined;
                            const tasks = data.tasks.filter(t => t.project_id === record.id);
                            const overdue = "due_date" in record && record.due_date && record.due_date < today && status !== "done";
                            return <Card key={record.id} className="h-full"><CardContent>
                                <div className="flex flex-wrap gap-2"><Badge variant={status === "done" ? "default" : "secondary"} className={status === "done" ? "bg-emerald-600 text-white hover:bg-emerald-600" : undefined}>{labels[status]}</Badge>{overdue && <Badge variant="destructive">{l("Überfällig", "Overdue")}</Badge>}{"priority" in record && record.priority === "high" && <Badge className="bg-orange-500 text-white hover:bg-orange-500">{l("Hohe Priorität", "High priority")}</Badge>}</div>
                                <h4 className="mt-2 text-lg font-semibold break-words">{title}</h4>
                                {"description" in record && <p className="line-clamp-2 text-sm">{record.description}</p>}
                                {"body" in record && <p className="line-clamp-3 text-sm">{record.body}</p>}
                                {project && <p className="text-sm text-muted-foreground">{project.name}</p>}
                                {"assignee" in record && record.assignee && <p className="text-sm">{record.assignee}</p>}
                                {"due_date" in record && record.due_date && <p className={overdue ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{l("Termin", "Due")}: {record.due_date}</p>}
                                {"budget" in record && <><p className="text-sm text-muted-foreground">{clients.find(c => c.id === record.client_id)?.name || l("Ohne Kunde", "No customer")} · {l("Planbudget", "Planned budget")}: {money(record.budget)}</p><Progress value={tasks.length ? Math.round(tasks.filter(t => t.status === "done").length / tasks.length * 100) : 0} className="h-1.5" /><p className="text-sm text-muted-foreground">{tasks.filter(t => t.status === "done").length}/{tasks.length} {labels.tasks}</p></>}
                                <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => edit(record)}>{l("Öffnen", "Open")}</Button>
                                    {key === "projects" && <Button variant="outline" disabled={busy} onClick={() => { setKey("tasks"); setSearch(""); setFilter("all"); setValues({ ...emptyValues, title: "", project_id: record.id, assignee: "", status: "todo", priority: "normal", due_date: "" }); setEditing({}); setDirty(false); setEditorError(""); setFieldErrors({}); }}>{l("Aufgabe anlegen", "Add task")}</Button>}
                                    {key === "documents" && <><Button variant="outline" disabled={busy} onClick={() => exportPdf(record.id)}>PDF</Button><Button variant="outline" onClick={() => { const doc = record as BusinessDocument; download(new Blob([`${doc.recipient}\n\n${doc.title}\n\n${doc.body}`], { type: "text/plain;charset=utf-8" }), "document.txt"); }}>TXT</Button></>}
                                    {key !== "projects" && <Button variant="destructive" disabled={busy} onClick={() => setDeleteId(record.id)}>{l("Löschen", "Delete")}</Button>}
                                </div>
                            </CardContent></Card>;
                        })}
                    </div>}
            </CardContent></Card>
            <details><summary style={{ cursor: "pointer" }}>{l("Hinweise zu Projekten und Exporten", "About projects and exports")}</summary><p className="mt-3 text-sm text-muted-foreground">{l("Budgets sind Planwerte. Zuständige Personen sind Textangaben, keine Einladungen. Projekte werden über „Erledigt“ archiviert. Der JSON-Export enthält nur diesen Arbeitsbereich; es gibt noch keinen automatischen Import oder Desktop-Abgleich.", "Budgets are estimates. Assignees are text labels, not invitations. Set projects to Done to archive them. JSON export contains this workspace only; automatic import and desktop synchronization are not available yet.")}</p></details>
        </div>
        <Dialog open={!!editing} onOpenChange={o => { if (!o) close(); }}><DialogContent showCloseButton={!busy} onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} className="sm:max-w-[720px]"><DialogHeader><DialogTitle>{`${labels[key]} · ${editing?.id ? l("Bearbeiten", "Edit") : l("Neu", "New")}`}</DialogTitle></DialogHeader>
            {editorError && <Alert variant="destructive" className="mb-4"><AlertTitle>{editorError}</AlertTitle></Alert>}
            <form onSubmit={e => { e.preventDefault(); void save(); }}>
                <fieldset disabled={busy} className="flex flex-col gap-4">
                <div><Label>{l("Titel", "Title")}</Label>{key === "projects" ? <Input maxLength={200} autoFocus value={values.name} onChange={e => set({ name: e.target.value })} /> : <Input maxLength={key === "tasks" ? 300 : 200} autoFocus value={values.title} onChange={e => set({ title: e.target.value })} />}{fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}</div>
                {key === "projects" ? <>
                    <div><Label>{l("Kunde (optional)", "Customer (optional)")}</Label><Select value={values.client_id || "__none"} onValueChange={v => set({ client_id: v === "__none" ? "" : v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">{l("Ohne Kunde", "No customer")}</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>{l("Beschreibung", "Description")}</Label><Textarea rows={3} maxLength={10000} value={values.description} onChange={e => set({ description: e.target.value })} /></div>
                    <div><Label>{l("Planbudget (EUR)", "Planned budget (EUR)")}</Label><DecimalInput min={0} max={1e12} precision={2} value={values.budget} onChange={v => set({ budget: v })} />{fieldErrors.budget && <p className="text-sm text-destructive">{fieldErrors.budget}</p>}</div>
                </> : <div><Label>{l("Projekt (optional)", "Project (optional)")}</Label><Select value={values.project_id || "__none"} onValueChange={v => set({ project_id: v === "__none" ? "" : v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__none">{l("Ohne Projekt", "No project")}</SelectItem>{data.projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>}
                {key === "documents" ? <>
                    <div><Label>{l("Vorlage", "Template")}</Label><Select value={values.kind} onValueChange={template}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses.documents.map(value => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>{l("Empfänger (optional)", "Recipient (optional)")}</Label><Textarea rows={2} maxLength={1000} value={values.recipient} onChange={e => set({ recipient: e.target.value })} /></div>
                    <div><Label>{l("Inhalt", "Content")}</Label><Textarea rows={12} maxLength={100000} value={values.body} onChange={e => set({ body: e.target.value })} /><p className="text-xs text-muted-foreground">{values.body.length} / 100000</p></div>
                </> : <>
                    <div><Label>Status</Label><Select value={values.status || undefined} onValueChange={v => set({ status: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses[key].map(value => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>{l("Termin (optional)", "Due date (optional)")}</Label><Input type="date" value={values.due_date} onChange={e => set({ due_date: e.target.value })} /></div>
                    {key === "tasks" && <><div><Label>{l("Zuständig (optional)", "Assignee (optional)")}</Label><Input maxLength={200} value={values.assignee} onChange={e => set({ assignee: e.target.value })} /></div><div><Label>{l("Priorität", "Priority")}</Label><Select value={values.priority} onValueChange={v => set({ priority: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">{l("Hoch", "High")}</SelectItem></SelectContent></Select></div></>}
                </>}
                <div className="flex flex-wrap items-center gap-2"><Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{l("Speichern", "Save")}</Button><Button type="button" variant="outline" onClick={close} disabled={busy}>{l("Abbrechen", "Cancel")}</Button><span className="text-sm text-muted-foreground">{dirty ? l("Ungespeicherte Änderungen", "Unsaved changes") : ""}</span></div>
                </fieldset>
            </form>
        </DialogContent></Dialog>
    </div>;
}
