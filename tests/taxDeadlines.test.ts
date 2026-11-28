import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    getTaxDeadlines2026,
    getTaxDeadlines2027,
    generateIcsCalendar,
} from "../src/lib/tools/taxDeadlines";

const params = {
    ustInterval: "quarter" as const,
    hasDauerfristverlaengerung: false,
    isEmployer: false,
    isGmbH: false,
};

describe("taxDeadlines", () => {
    it("keeps the 2026 calendar unchanged (weekend shifting)", () => {
        const list = getTaxDeadlines2026(params);
        const gewst = list.filter((d) => d.category === "GewSt");
        assert.deepEqual(
            gewst.map((d) => `${d.nominalDate}->${d.dueDate}`),
            [
                "2026-02-15->2026-02-16",
                "2026-05-15->2026-05-15",
                "2026-08-15->2026-08-17",
                "2026-11-15->2026-11-16",
            ],
        );
        assert.ok(list.some((d) => d.id === "tax-return-self-2025"));
    });

    it("computes the 2027 calendar with Easter-based holiday shifting", () => {
        const list = getTaxDeadlines2027(params);
        const byId = new Map(list.map((d) => [d.id, d]));
        // 10 Apr 2027 is a Saturday -> Monday 12 Apr 2027
        assert.equal(byId.get("ust-q1")?.dueDate, "2027-04-12");
        // 15 May 2027 Sat -> Sun -> Pfingstmontag 17 May -> Tue 18 May
        assert.equal(byId.get("gewst-q2")?.dueDate, "2027-05-18");
        // Jahreserklaerung 2026: 31 Jul 2027 is a Saturday -> Mon 2 Aug 2027
        assert.equal(byId.get("tax-return-self-2026")?.dueDate, "2027-08-02");
        assert.ok(list.every((d) => d.dueDate >= d.nominalDate));
    });

    it("labels the generated ICS with the requested year", () => {
        const ics = generateIcsCalendar(getTaxDeadlines2027(params), 2027);
        assert.match(ics, /Steuerkalender 2027/);
        assert.doesNotMatch(ics, /Steuerkalender 2026/);
    });
});
