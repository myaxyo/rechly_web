// Local tools only. Download pinned validators as documented before running.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";
import { XMLParser } from "fast-xml-parser";
import PDFDocument from "pdfkit";

const required = name => {
    if (!process.env[name]) throw new Error(`Set ${name}; see docs/COMPLIANCE_VALIDATION.md`);
    return path.resolve(process.env[name]);
};
const kosit = required("KOSIT_JAR");
const config = required("KOSIT_CONFIG");
const vera = required("VERAPDF_BIN");
const mustang = required("MUSTANG_JAR");
const output = path.resolve(process.argv[2] || ".cache/compliance");
mkdirSync(output, { recursive: true });
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
const parse = file => parser.parse(readFileSync(file, "utf8"));
const hash = file => createHash("sha256").update(readFileSync(file)).digest("hex");
const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
const run = (command, args, allowFailure = false) => {
    const result = spawnSync(command, args, { encoding: "utf8", timeout: 60000, maxBuffer: 20 * 1024 * 1024 });
    if (result.error || (!allowFailure && result.status !== 0)) throw new Error(`${command}: ${result.error || result.stderr || result.stdout}`);
    return result;
};
run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/generate-compliance-fixtures.ts", output]);
const names = ["identifiers", "legacy", "exempt", "mixed", "discount", "credit", "multipage"];
const kositArgs = ["-jar", kosit, "-s", path.join(config, "scenarios.xml"), "-r", config, "-o", output];
const xmlFiles = names.map(name => path.join(output, `${name}-xrechnung.xml`));
writeFileSync(path.join(output, "kosit.log"), run("java", [...kositArgs, ...xmlFiles]).stdout);
for (const name of names) {
    const report = parse(path.join(output, `${name}-xrechnung-report.xml`)).report;
    assert.equal(report.scenarioMatched.scenario.name, "EN16931 XRechnung (CII)", name);
    // KoSIT can accept documents with warnings despite valid="false". Require
    // both full validity and acceptance, not merely a zero CLI exit status.
    assert.equal(report["@_valid"], "true", `KoSIT: ${name}`);
    assert.ok(Object.hasOwn(report.assessment, "accept"), `KoSIT acceptance: ${name}`);
}
const veraOutput = run(vera, ["--format", "xml", "--flavour", "3b", ...names.map(name => path.join(output, `${name}.pdf`))]);
writeFileSync(path.join(output, "verapdf.xml"), veraOutput.stdout);
const jobs = list(parse(path.join(output, "verapdf.xml")).report.jobs.job);
assert.equal(jobs.length, names.length);
for (const job of jobs) {
    assert.equal(job.validationReport["@_isCompliant"], "true", job.item?.name);
    assert.equal(job.validationReport["@_profileName"], "PDF/A-3b validation profile");
}
const results = [];
for (const name of names) {
    const pdf = path.join(output, `${name}.pdf`);
    const result = run("java", ["-jar", mustang, "--action", "validate", "--source", pdf, "--disable-file-logging"]);
    writeFileSync(path.join(output, `${name}-mustang.xml`), result.stdout);
    writeFileSync(path.join(output, `${name}-mustang.log`), result.stderr);
    const validation = parser.parse(result.stdout).validation;
    assert.equal(validation.summary["@_status"], "valid", `Mustang: ${name}`);
    const extracted = path.join(output, `${name}-embedded.xml`);
    run("pdfdetach", ["-save", "1", "-o", extracted, pdf]);
    assert.equal(readFileSync(extracted, "utf8"), readFileSync(path.join(output, `${name}-en16931.xml`), "utf8"));
    results.push({ name, kosit: "valid and accepted", pdfa3b: "compliant", mustang: "valid", embeddedXmlMatches: true,
        pdfSha256: hash(pdf), xrechnungSha256: hash(path.join(output, `${name}-xrechnung.xml`)),
        notices: list(validation.xml?.messages?.notice).map(notice => typeof notice === "string" ? notice : notice["#text"]),
    });
}

// Negative controls ensure the pipeline rejects invalid documents.
const badXml = path.join(output, "invalid-xrechnung.xml");
writeFileSync(badXml, readFileSync(xmlFiles[0], "utf8").replace(/<ram:BuyerReference>.*?<\/ram:BuyerReference>/s, ""));
run("java", [...kositArgs, badXml], true);
assert.equal(parse(path.join(output, "invalid-xrechnung-report.xml")).report["@_valid"], "false");
const badPdf = path.join(output, "invalid.pdf");
await new Promise((resolve, reject) => {
    const doc = new PDFDocument(); const chunks = [];
    doc.on("data", chunk => chunks.push(chunk)); doc.on("error", reject);
    doc.on("end", () => { writeFileSync(badPdf, Buffer.concat(chunks)); resolve(); });
    doc.text("Negative control: unembedded standard font and no PDF/A metadata."); doc.end();
});
const negative = run(vera, ["--format", "xml", "--flavour", "3b", badPdf], true);
writeFileSync(path.join(output, "invalid-verapdf.xml"), negative.stdout);
assert.equal(parser.parse(negative.stdout).report.jobs.job.validationReport["@_isCompliant"], "false");
const summary = { date: new Date().toISOString(),
    tools: { kositSha256: hash(kosit), scenariosSha256: hash(path.join(config, "scenarios.xml")),
        veraPDF: run(vera, ["--version"]).stdout.trim(), mustangSha256: hash(mustang) },
    results, negativeControls: { missingBuyerReferenceRejected: true, nonArchivalPdfRejected: true },
};
writeFileSync(path.join(output, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(`PASS: ${names.length} cases, KoSIT + PDF/A-3b + Mustang + attachment equality; both negative controls rejected. Reports: ${output}`);
