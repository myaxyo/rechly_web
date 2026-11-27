"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { BusinessProject, BusinessTask } from "@/lib/workspace/domain";
import { localDay, useWords } from "./common";
export default function TaskBoard({ tasks, projects, busy, edit, change }: { tasks: BusinessTask[]; projects: BusinessProject[]; busy: boolean; edit: (task: BusinessTask) => void; change: (task: BusinessTask, status: BusinessTask["status"]) => Promise<void> }) {
    const { l } = useWords();
    const statuses = [{ value: "todo", label: l("Offen", "To do") }, { value: "doing", label: l("In Arbeit", "In progress") }, { value: "done", label: l("Erledigt", "Done") }];
    return <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{statuses.map(status => <Card key={status.value}><CardHeader><CardTitle>{`${status.label} (${tasks.filter(t => t.status === status.value).length})`}</CardTitle></CardHeader><CardContent><div className="flex w-full flex-col gap-4">{tasks.filter(t => t.status === status.value).map(task => <Card key={task.id}><CardContent>
            <h5 className="font-semibold break-words">{task.title}</h5>
            <p className="text-sm text-muted-foreground">{projects.find(p => p.id === task.project_id)?.name}{task.assignee && ` · ${task.assignee}`}</p>
            <div className="flex flex-wrap gap-2">{task.priority === "high" && <Badge className="bg-orange-500 text-white hover:bg-orange-500">{l("Hohe Priorität", "High priority")}</Badge>}{task.due_date && <Badge variant={task.status !== "done" && task.due_date < localDay() ? "destructive" : "secondary"}>{task.due_date}</Badge>}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2"><Button disabled={busy} onClick={() => edit(task)}>{l("Öffnen", "Open")}</Button><Select disabled={busy} value={task.status} onValueChange={value => change(task, value as BusinessTask["status"])}><SelectTrigger aria-label={`${l("Status", "Status")}: ${task.title}`} style={{ minWidth: 120 }}><SelectValue /></SelectTrigger><SelectContent>{statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        </CardContent></Card>)}{!tasks.some(t => t.status === status.value) && <div className="py-8 text-center text-sm text-muted-foreground">{l("Keine Aufgaben", "No tasks")}</div>}</div></CardContent></Card>)}</div>;
}
