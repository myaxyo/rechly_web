import { writeFileSync } from "node:fs";
import { generateXRechnungXML } from "../src/lib/eRechnung/xrechnung";
import { invoice, company } from "../tests/fixtures/identifier-invoice";
for (const profile of ["xrechnung", "en16931"] as const) {
    writeFileSync(`tests/fixtures/identifiers-${profile}.xml`, generateXRechnungXML(invoice, company, profile));
}
