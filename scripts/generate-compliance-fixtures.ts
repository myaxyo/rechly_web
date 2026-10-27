import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { complianceCases } from "../tests/fixtures/compliance-cases";
import { generateXRechnungXML } from "../src/lib/eRechnung/xrechnung";
import { generateZUGFeRDPDF } from "../src/lib/eRechnung/zugferd";

async function main() {
    const output = path.resolve(process.argv[2] || ".cache/compliance");
    await mkdir(output, { recursive: true });
    for (const [name, { invoice, company }] of Object.entries(complianceCases())) {
        for (const profile of ["xrechnung", "en16931"] as const) {
            await writeFile(path.join(output, `${name}-${profile}.xml`), generateXRechnungXML(invoice, company, profile));
        }
        await writeFile(path.join(output, `${name}.pdf`), await generateZUGFeRDPDF(invoice, company));
    }
    console.log(`Wrote seven synthetic XML/PDF cases to ${output}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
