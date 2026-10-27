# Invoice export validation — 2026-10-27

The generated test corpus is validated with the full KoSIT XRechnung scenario,
veraPDF's PDF/A-3b profile and Mustang's PDF/Factur-X validator. This verifies
these outputs, rather than claiming that every possible invoice input is valid.

## Tools and profiles

| Tool | Version / configuration | Scope |
| --- | --- | --- |
| KoSIT Validator | 1.6.3; XRechnung 3.0.2 configuration release 2026-08-31 | CII schema, EN 16931 and XRechnung business rules; scenario `EN16931 XRechnung (CII)` |
| veraPDF | 1.30.3 | Explicit ISO 19005-3 PDF/A-3b profile |
| Mustang CLI | 2.26.0 | PDF container, Factur-X EN 16931 embedded XML, metadata and arithmetic checks |
| Poppler `pdfdetach` | Local command-line utility | Extract attachment and compare it byte-for-byte with generated EN 16931 XML |

The PDF conformance level is **3b**, not 3a or 3u. No accessibility or digital
signature conformance is claimed. UBL is not generated or covered.

## Results

The corpus in `tests/fixtures/compliance-cases.ts` contains seven synthetic cases:
identifiers/delivery/GTIN, absent identifiers (legacy), small-business VAT
exemption, mixed 19%/7% VAT, 10% line discount, a negative-quantity credit, and
40 lines across multiple pages with German characters. The credit case retains
the application's existing negative invoice representation (CII type 380); this
is not a test of a separate type-381 credit-note exporter.

See [machine-readable results](validation/summary.json),
[veraPDF report](validation/verapdf.xml),
[KoSIT example report](validation/kosit-identifiers.xml),
[Mustang example report](validation/mustang-identifiers.xml), and the
[validated example PDF](validation/identifiers.pdf).

The repeatable runner requires all seven cases to pass all checks. It requires
KoSIT `valid="true"` **and** acceptance: a zero process exit status or
`ACCEPTABLE` alone is insufficient because KoSIT can accept warning-level rule
failures. It also deliberately removes BT-10 and generates a non-archival PDF,
and asserts that both negative controls are rejected.

Mustang emits the informational notice BR-DE-21 for the base EN 16931 attachment
because its optional German checks prefer the XRechnung profile identifier.
Its overall PDF and XML results are valid. The attachment intentionally uses
the Factur-X EN 16931 profile; the separate XRechnung export uses the XRechnung
profile and is checked by KoSIT. The notice is retained in the report.

## Defects found and corrected

The original PDF failed five veraPDF rules (81 failed checks): unembedded
standard fonts, missing RGB/gray output intent, missing attachment MIME type,
and missing document metadata. The exporter now:

- Enables PDFKit's PDF/A-3b mode with PDF 1.7 and its sRGB ICC output intent.
- Embeds bundled Liberation Sans regular/bold fonts under the SIL OFL license.
- Writes Factur-X XMP properties and their PDF/A extension-schema declarations.
- Sets the attachment's MIME type and PDFKit `relationship: "Alternative"`.
- Includes fonts and PDFKit's ICC data in the standalone deployment trace.

The broader KoSIT run also found PEPPOL-EN16931-R120 on discounted lines: their
net amount reflected the discount but their XML net unit price did not. XML and
the embedded-XML PDF now show the discounted net unit price; the PDF also states
the discount. Invoice totals and stored prices are unchanged. A unit regression
test checks the 100 → 90 net / 107.10 gross case.

## Reproduce locally

Prerequisites: Node dependencies installed, Java 21, and Poppler `pdfdetach`.
The validators run locally; no invoices are uploaded to a validation service.
Download the following official release artifacts into a disposable tools
directory, outside the repository:

- [KoSIT 1.6.3 standalone JAR](https://github.com/itplr-kosit/validator/releases/download/v1.6.3/validator-1.6.3-standalone.jar)
- [XRechnung configuration 2026-08-31 ZIP](https://github.com/itplr-kosit/validator-configuration-xrechnung/releases/download/v2026-08-31/xrechnung-3.0.2-validator-configuration-2026-08-31.zip)
- [veraPDF 1.30.3 installer ZIP](https://repo.maven.apache.org/maven2/org/verapdf/apps/installer/1.30.3/installer-1.30.3-installer.zip)
- [Mustang CLI 2.26.0 JAR](https://repo.maven.apache.org/maven2/org/mustangproject/Mustang-CLI/2.26.0/Mustang-CLI-2.26.0.jar)

Unzip the KoSIT configuration. Unzip veraPDF and run its installer JAR with
`java -jar verapdf-izpack-installer-1.30.3.jar -console`; select the CLI pack and
a writable destination. Then run:

```bash
KOSIT_JAR=/path/to/validator-1.6.3-standalone.jar \
KOSIT_CONFIG=/path/to/unzipped-xrechnung-config \
VERAPDF_BIN=/path/to/verapdf/verapdf \
MUSTANG_JAR=/path/to/Mustang-CLI-2.26.0.jar \
node scripts/validate-invoice-compliance.mjs

npm run test:einvoice
npx tsc --noEmit
npm run build
```

The runner writes generated PDFs/XML, full reports, logs, hashes and
`summary.json` into ignored `.cache/compliance`. An optional output-directory
argument changes that location. Validator JAR and scenario hashes are included
in the summary. Each PDF is checked against its own extracted XML attachment.

## Practical limits

These results replace the earlier “unverified” status for the tested exports.
They do not certify the entire SaaS or establish the truth of customer data,
tax treatment, buyer references or recipient-specific requirements. A valid
example cannot prove every combination of amounts, rounding, address text and
future schema versions. Production invoices should continue to be checked with
the applicable validator, especially after changes to export or tax code.

Live Appwrite migration/staging verification is a separate deployment task and
was not part of these document-format checks. The React-PDF preview/download
is not the PDF/A export: these PDF/A checks cover `/api/invoices/[id]/zugferd`.
