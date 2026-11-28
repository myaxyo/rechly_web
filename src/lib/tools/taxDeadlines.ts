/**
 * Statutory German Tax Deadlines (Steuerkalender & Fristen)
 * Accounts for weekend / public holiday shifting (§ 108 Abs. 3 AO)
 * and the 3-day statutory bank grace period (Schonfrist § 240 Abs. 3 AO).
 */

export interface TaxDeadline {
    id: string;
    title: string;
    category: "USt" | "ESt" | "GewSt" | "LSt" | "ZM" | "Erklärung";
    dueDate: string; // YYYY-MM-DD (nominal or shifted)
    nominalDate: string; // YYYY-MM-DD (statutory date before shift)
    schonfristDate: string; // YYYY-MM-DD (3-day grace period for bank transfer)
    description: string;
    appliesTo: ("freelancer" | "gmbh" | "kleinunternehmer" | "employer")[];
    legalBasis: string;
}

// Helper to determine if a date is a weekend (Saturday or Sunday)
function isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
}

// Easter Sunday (Meeus/Jones/Butcher computus, same algorithm as holidays.ts)
function getEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const mm = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * mm + 114) / 31) - 1;
    const day = ((h + l - 7 * mm + 114) % 31) + 1;
    return new Date(Date.UTC(year, month, day));
}

function addDaysUtc(d: Date, days: number): Date {
    const res = new Date(d.getTime());
    res.setUTCDate(res.getUTCDate() + days);
    return res;
}

// Simple fixed German nationwide holidays check for shifting
function isNationwideHoliday(d: Date): boolean {
    const m = d.getMonth() + 1; // 1-12
    const day = d.getDate();

    // Fixed nationwide holidays:
    // 01-01 Neujahr, 05-01 Tag der Arbeit, 10-03 Tag der Deutschen Einheit, 12-25 1. Weihnachtstag, 12-26 2. Weihnachtstag
    if (m === 1 && day === 1) return true;
    if (m === 5 && day === 1) return true;
    if (m === 10 && day === 3) return true;
    if (m === 12 && day === 25) return true;
    if (m === 12 && day === 26) return true;

    // Easter-based nationwide holidays (Karfreitag, Ostermontag,
    // Christi Himmelfahrt, Pfingstmontag), computed for any year.
    const easter = getEasterSunday(d.getFullYear());
    const easterBased = [
        addDaysUtc(easter, -2),
        addDaysUtc(easter, 1),
        addDaysUtc(easter, 39),
        addDaysUtc(easter, 50),
    ];
    if (easterBased.some((h) => h.getUTCFullYear() === d.getFullYear() && h.getUTCMonth() + 1 === m && h.getUTCDate() === day)) return true;

    return false;
}

// § 108 Abs. 3 AO: Fällt das Ende einer Frist auf einen Sonntag, Feiertag oder Sonnabend,
// so endet die Frist mit dem Ablauf des nächstfolgenden Werktags.
export function shiftToNextWorkday(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const cur = new Date(y, m - 1, d);

    while (isWeekend(cur) || isNationwideHoliday(cur)) {
        cur.setDate(cur.getDate() + 1);
    }

    const resY = cur.getFullYear();
    const resM = String(cur.getMonth() + 1).padStart(2, "0");
    const resD = String(cur.getDate()).padStart(2, "0");
    return `${resY}-${resM}-${resD}`;
}

// § 240 Abs. 3 AO: Eine Säumniszuschlag wird bei einer Überweisung erst erhoben,
// wenn die Zahlung nicht innerhalb von drei Tagen nach Ablauf des Fälligkeitstags eingeht.
export function calculateSchonfristDate(shiftedDueDateStr: string): string {
    const [y, m, d] = shiftedDueDateStr.split("-").map(Number);
    const cur = new Date(y, m - 1, d);
    cur.setDate(cur.getDate() + 3);

    // If the 3rd day falls on weekend/holiday, bank transfer processing extends to next workday
    while (isWeekend(cur) || isNationwideHoliday(cur)) {
        cur.setDate(cur.getDate() + 1);
    }

    const resY = cur.getFullYear();
    const resM = String(cur.getMonth() + 1).padStart(2, "0");
    const resD = String(cur.getDate()).padStart(2, "0");
    return `${resY}-${resM}-${resD}`;
}

export function getTaxDeadlines(year: number, params: {
    ustInterval: "month" | "quarter" | "none";
    hasDauerfristverlaengerung: boolean;
    isEmployer: boolean;
    isGmbH: boolean;
}): TaxDeadline[] {
    const list: TaxDeadline[] = [];

    // 1. ESt & KSt Vorauszahlungen (§ 37 Abs. 1 EStG / § 31 KStG)
    // 10. März, 10. Juni, 10. September, 10. Dezember
    const estDates = [
        { nominal: `${year}-03-10`, label: "ESt / KSt Vorauszahlung Q1" },
        { nominal: `${year}-06-10`, label: "ESt / KSt Vorauszahlung Q2" },
        { nominal: `${year}-09-10`, label: "ESt / KSt Vorauszahlung Q3" },
        { nominal: `${year}-12-10`, label: "ESt / KSt Vorauszahlung Q4" },
    ];

    estDates.forEach((d, idx) => {
        const shifted = shiftToNextWorkday(d.nominal);
        list.push({
            id: `est-q${idx + 1}`,
            title: d.label,
            category: "ESt",
            nominalDate: d.nominal,
            dueDate: shifted,
            schonfristDate: calculateSchonfristDate(shifted),
            description: "Vierteljährliche Vorauszahlung auf die Einkommensteuer bzw. Körperschaftsteuer.",
            appliesTo: ["freelancer", "gmbh"],
            legalBasis: "§ 37 Abs. 1 EStG, § 31 KStG",
        });
    });

    // 2. Gewerbesteuer Vorauszahlungen (§ 19 GewStG)
    // 15. Februar, 15. Mai, 15. August, 15. November
    const gewstDates = [
        { nominal: `${year}-02-15`, label: "Gewerbesteuer Vorauszahlung Q1" },
        { nominal: `${year}-05-15`, label: "Gewerbesteuer Vorauszahlung Q2" },
        { nominal: `${year}-08-15`, label: "Gewerbesteuer Vorauszahlung Q3" },
        { nominal: `${year}-11-15`, label: "Gewerbesteuer Vorauszahlung Q4" },
    ];

    gewstDates.forEach((d, idx) => {
        const shifted = shiftToNextWorkday(d.nominal);
        list.push({
            id: `gewst-q${idx + 1}`,
            title: d.label,
            category: "GewSt",
            nominalDate: d.nominal,
            dueDate: shifted,
            schonfristDate: calculateSchonfristDate(shifted),
            description: "Gewerbesteuer-Vorauszahlung an die jeweilige Stadt- bzw. Gemeindekasse.",
            appliesTo: ["freelancer", "gmbh"],
            legalBasis: "§ 19 GewStG",
        });
    });

    // 3. Umsatzsteuer-Voranmeldung (USt-VA) (§ 18 Abs. 1 UStG)
    if (params.ustInterval === "quarter") {
        const quarters = [
            { nominal: params.hasDauerfristverlaengerung ? `${year}-05-10` : `${year}-04-10`, label: `USt-VA Q1/${year}` },
            { nominal: params.hasDauerfristverlaengerung ? `${year}-08-10` : `${year}-07-10`, label: `USt-VA Q2/${year}` },
            { nominal: params.hasDauerfristverlaengerung ? `${year}-11-10` : `${year}-10-10`, label: `USt-VA Q3/${year}` },
            { nominal: params.hasDauerfristverlaengerung ? `${year + 1}-02-10` : `${year + 1}-01-10`, label: `USt-VA Q4/${year}` },
        ];

        quarters.forEach((q, idx) => {
            const shifted = shiftToNextWorkday(q.nominal);
            list.push({
                id: `ust-q${idx + 1}`,
                title: q.label,
                category: "USt",
                nominalDate: q.nominal,
                dueDate: shifted,
                schonfristDate: calculateSchonfristDate(shifted),
                description: `Voranmeldung und Zahllast für das ${idx + 1}. Quartal ${year} via ELSTER.`,
                appliesTo: ["freelancer", "gmbh"],
                legalBasis: params.hasDauerfristverlaengerung ? "§ 18 Abs. 1 UStG i.V.m. § 46 UStDV" : "§ 18 Abs. 1 UStG",
            });
        });
    } else if (params.ustInterval === "month") {
        for (let m = 1; m <= 12; m++) {
            const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
            const targetM = params.hasDauerfristverlaengerung ? m + 2 : m + 1;
            const targetY = targetM > 12 ? year + 1 : year;
            const normM = targetM > 12 ? targetM - 12 : targetM;
            const nominal = `${targetY}-${String(normM).padStart(2, "0")}-10`;
            const shifted = shiftToNextWorkday(nominal);

            list.push({
                id: `ust-m${m}`,
                title: `USt-VA ${monthNames[m - 1]} ${year}`,
                category: "USt",
                nominalDate: nominal,
                dueDate: shifted,
                schonfristDate: calculateSchonfristDate(shifted),
                description: `Monatliche Voranmeldung und Zahllast für ${monthNames[m - 1]} ${year}.`,
                appliesTo: ["freelancer", "gmbh"],
                legalBasis: params.hasDauerfristverlaengerung ? "§ 18 Abs. 1 UStG i.V.m. § 46 UStDV" : "§ 18 Abs. 1 UStG",
            });
        }
    }

    // 4. Lohnsteuer-Anmeldung (falls Arbeitgeber) (§ 41a EStG)
    if (params.isEmployer) {
        for (let m = 1; m <= 12; m++) {
            const nominal = m === 12 ? `${year + 1}-01-10` : `${year}-${String(m + 1).padStart(2, "0")}-10`;
            const shifted = shiftToNextWorkday(nominal);
            list.push({
                id: `lst-m${m}`,
                title: `Lohnsteuer-Anmeldung Monat ${m}`,
                category: "LSt",
                nominalDate: nominal,
                dueDate: shifted,
                schonfristDate: calculateSchonfristDate(shifted),
                description: "Übermittlung der Lohnsteuerbescheinigung und Abführung an das Betriebsstättenfinanzamt.",
                appliesTo: ["employer"],
                legalBasis: "§ 41a EStG",
            });
        }
    }

    // 5. Jahreserklärungen (Umsatzsteuer, EÜR, Körperschaftsteuer) für das Vorjahr
    // Ohne Berater: 31. Juli des Kalenderjahres (für das Vorjahr)
    const yearShifted = shiftToNextWorkday(`${year}-07-31`);
    list.push({
        id: `tax-return-self-${year - 1}`,
        title: `Steuererklärung ${year - 1} (ohne Steuerberater)`,
        category: "Erklärung",
        nominalDate: `${year}-07-31`,
        dueDate: yearShifted,
        schonfristDate: calculateSchonfristDate(yearShifted),
        description: `Abgabefrist für Einkommensteuer-, Gewerbesteuer- und Umsatzsteuererklärung ${year - 1} für Selbstveranlager.`,
        appliesTo: ["freelancer", "gmbh", "kleinunternehmer"],
        legalBasis: "§ 149 Abs. 2 AO",
    });

    // Sort by dueDate ascending
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getTaxDeadlines2026(params: Parameters<typeof getTaxDeadlines>[1]): TaxDeadline[] {
    return getTaxDeadlines(2026, params);
}

export function getTaxDeadlines2027(params: Parameters<typeof getTaxDeadlines>[1]): TaxDeadline[] {
    return getTaxDeadlines(2027, params);
}

// Generate an iCalendar (.ics) format string for the deadlines
export function generateIcsCalendar(deadlines: TaxDeadline[], year?: number): string {
    const calendarYear = year ?? (deadlines[0] ? Number(deadlines[0].nominalDate.slice(0, 4)) : 2026);
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        `PRODID:-//Rechly//Steuerkalender ${calendarYear}//DE`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:Rechly Steuerkalender ${calendarYear}`,
        "X-WR-TIMEZONE:Europe/Berlin",
    ];

    deadlines.forEach((d) => {
        const cleanDate = d.dueDate.replace(/-/g, "");
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${d.id}-${calendarYear}@rechly.de`);
        lines.push(`DTSTAMP:${calendarYear}0101T080000Z`);
        lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
        lines.push(`DTEND;VALUE=DATE:${cleanDate}`);
        lines.push(`SUMMARY:${d.title}`);
        lines.push(`DESCRIPTION:${d.description}\\nRechtsgrundlage: ${d.legalBasis}\\nSchonfrist bei Überweisung bis: ${d.schonfristDate}`);
        lines.push(`STATUS:CONFIRMED`);
        lines.push("BEGIN:VALARM");
        lines.push("TRIGGER:-P3D");
        lines.push("ACTION:DISPLAY");
        lines.push(`DESCRIPTION:Erinnerung: In 3 Tagen fällig: ${d.title}`);
        lines.push("END:VALARM");
        lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}
