"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function ImpressumGenerator() {
    const [legalForm, setLegalForm] = useState<string>("einzelunternehmen");
    const [companyName, setCompanyName] = useState<string>("Max Mustermann IT & Webentwicklung");
    const [fullName, setFullName] = useState<string>("Max Mustermann");
    const [street, setStreet] = useState<string>("Musterstraße 42");
    const [zip, setZip] = useState<string>("10115");
    const [city, setCity] = useState<string>("Berlin");
    const [email, setEmail] = useState<string>("kontakt@mustermann-it.de");
    const [phone, setPhone] = useState<string>("+49 (0) 30 12345678");
    const [vatId, setVatId] = useState<string>("DE123456789");
    const [commercialRegister, setCommercialRegister] = useState<string>("");
    const [registerCourt, setRegisterCourt] = useState<string>("");
    const [managingDirector] = useState<string>("");
    const [chamber] = useState<string>("");
    const [jobTitle] = useState<string>("");

    const [copiedHtml, setCopiedHtml] = useState(false);
    const [copiedText, setCopiedText] = useState(false);

    // Generate compliant § 5 DDG Impressum
    const impressumText = useMemo(() => {
        const lines: string[] = [
            `Impressum`,
            `Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG):`,
            ``,
            companyName,
            ...(legalForm === "gmbh" || legalForm === "ug"
                ? [`Vertreten durch den Geschäftsführer: ${managingDirector || fullName}`]
                : [`Inhaber: ${fullName}`]),
            street,
            `${zip} ${city}`,
            `Deutschland`,
            ``,
            `Kontakt:`,
            `Telefon: ${phone}`,
            `E-Mail: ${email}`,
            ``,
        ];

        if (commercialRegister || registerCourt) {
            lines.push(
                `Registereintrag:`,
                `Eintragung im Handelsregister.`,
                `Registergericht: ${registerCourt || "Amtsgericht Berlin-Charlottenburg"}`,
                `Registernummer: ${commercialRegister || "HRB 123456"}`,
                ``
            );
        }

        if (vatId) {
            lines.push(
                `Umsatzsteuer-Identifikationsnummer:`,
                `Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:`,
                vatId,
                ``
            );
        }

        if (jobTitle || chamber) {
            lines.push(
                `Berufsbezeichnung und berufsrechtliche Regelungen:`,
                `Berufsbezeichnung: ${jobTitle || "Selbstständige(r)"}`,
                `Zuständige Kammer: ${chamber || "IHK / Handwerkskammer"}`,
                `Es gelten die entsprechenden gesetzlichen Berufsregelungen.`,
                ``
            );
        }

        lines.push(
            `EU-Streitschlichtung:`,
            `Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:`,
            `https://ec.europa.eu/consumers/odr/`,
            `Unsere E-Mail-Adresse finden Sie oben im Impressum.`,
            ``,
            `Verbraucherstreitbeilegung / Universalschlichtungsstelle:`,
            `Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.`
        );

        return lines.join("\n");
    }, [
        legalForm,
        companyName,
        fullName,
        street,
        zip,
        city,
        email,
        phone,
        vatId,
        commercialRegister,
        registerCourt,
        managingDirector,
        chamber,
        jobTitle,
    ]);

    const impressumHtml = useMemo(() => {
        return `<h1>Impressum</h1>
<p><strong>Angaben gem&auml;&szlig; &sect; 5 Digitale-Dienste-Gesetz (DDG):</strong></p>
<p>${companyName}<br />
${legalForm === "gmbh" || legalForm === "ug" ? `Vertreten durch: ${managingDirector || fullName}<br />` : `Inhaber: ${fullName}<br />`}
${street}<br />
${zip} ${city}</p>
<p><strong>Kontakt:</strong><br />
Telefon: ${phone}<br />
E-Mail: ${email}</p>
${
    commercialRegister
        ? `<p><strong>Registereintrag:</strong><br />
Registergericht: ${registerCourt}<br />
Registernummer: ${commercialRegister}</p>`
        : ""
}
${
    vatId
        ? `<p><strong>Umsatzsteuer-ID:</strong><br />
Umsatzsteuer-Identifikationsnummer gem&auml;&szlig; &sect; 27 a Umsatzsteuergesetz:<br />
${vatId}</p>`
        : ""
}
<p><strong>EU-Streitschlichtung:</strong><br />
Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>.<br />
Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>`;
    }, [
        companyName,
        legalForm,
        managingDirector,
        fullName,
        street,
        zip,
        city,
        phone,
        email,
        commercialRegister,
        registerCourt,
        vatId,
    ]);

    const copyText = () => {
        if (typeof window !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(impressumText);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2500);
        }
    };

    const copyHtml = () => {
        if (typeof window !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(impressumHtml);
            setCopiedHtml(true);
            setTimeout(() => setCopiedHtml(false), 2500);
        }
    };

    return (
        <div>
            {/* Regulatory Notice Banner */}
            <div
                style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    padding: "16px 20px",
                    borderRadius: 10,
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 12 }}
            >
                <ShieldCheck style={{ width: 24, height: 24, color: "#16a34a", flexShrink: 0 }} />
                <div style={{ fontSize: 14, color: "#166534", lineHeight: 1.5 }}>
                    <strong>Aktuelle Rechtslage:</strong> Das Digitale-Dienste-Gesetz (§ 5 DDG) hat am 14. Mai 2024 das alte
                    Telemediengesetz (§ 5 TMG) vollständig abgelöst. Dieser Generator erstellt die aktuelle, abmahnsichere
                    Formulierung für Webseiten und Social-Media-Kanäle deutscher Unternehmen.
                </div>
            </div>

            {/* Inputs & Configuration */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 28 }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Unternehmensform (Rechtsform) *
                    </label>
                    <Select value={legalForm} onValueChange={setLegalForm}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="einzelunternehmen">Einzelunternehmen / Freiberufler</SelectItem>
                            <SelectItem value="gbr">Gesellschaft bürgerlichen Rechts (GbR)</SelectItem>
                            <SelectItem value="gmbh">GmbH (Gesellschaft mit beschränkter Haftung)</SelectItem>
                            <SelectItem value="ug">UG (haftungsbeschränkt)</SelectItem>
                            <SelectItem value="ek">Eingetragener Kaufmann / Kauffrau (e. K.)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Firmenname / Geschäftsbezeichnung *
                    </label>
                    <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Vor- und Nachname (Inhaber / GF) *
                    </label>
                    <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Straße und Hausnummer *
                    </label>
                    <Input
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                            PLZ *
                        </label>
                        <Input
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                            Ort *
                        </label>
                        <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        E-Mail-Adresse *
                    </label>
                    <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Telefonnummer *
                    </label>
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                        Umsatzsteuer-ID (falls vorhanden)
                    </label>
                    <Input
                        placeholder="z. B. DE123456789"
                        value={vatId}
                        onChange={(e) => setVatId(e.target.value.toUpperCase())}
                    />
                </div>

                {(legalForm === "gmbh" || legalForm === "ug" || legalForm === "ek") && (
                    <>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                                Handelsregister-Nummer
                            </label>
                            <Input
                                placeholder="z. B. HRB 123456 B"
                                value={commercialRegister}
                                onChange={(e) => setCommercialRegister(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                                Registergericht
                            </label>
                            <Input
                                placeholder="z. B. Amtsgericht Berlin-Charlottenburg"
                                value={registerCourt}
                                onChange={(e) => setRegisterCourt(e.target.value)}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Generated Output Tabs */}
            <Tabs defaultValue="text">
                <TabsList>
                    <TabsTrigger value="text">Klartext / Markdown</TabsTrigger>
                    <TabsTrigger value="html">HTML-Code</TabsTrigger>
                </TabsList>
                <TabsContent value="text">
                            <div>
                                <pre
                                    style={{
                                        background: "#f8fafc",
                                        border: "1px solid #cbd5e1",
                                        padding: 20,
                                        borderRadius: 8,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        color: "#1e293b",
                                        whiteSpace: "pre-wrap",
                                        maxHeight: 450,
                                        overflow: "auto" }}
                                >
                                    {impressumText}
                                </pre>
                                <div style={{ marginTop: 16 }}>
                                    <Button
                                        onClick={copyText}
                                        style={{ background: "#2855d9" }}
                                    >
                                        {copiedText ? <Check /> : <Copy />} {copiedText ? " kopiert!" : "Klartext kopieren"}
                                    </Button>
                                </div>
                            </div>
                </TabsContent>
                <TabsContent value="html">
                            <div>
                                <pre
                                    style={{
                                        background: "#0f172a",
                                        border: "1px solid #334155",
                                        color: "#f8fafc",
                                        padding: 20,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                        whiteSpace: "pre-wrap",
                                        maxHeight: 450,
                                        overflow: "auto" }}
                                >
                                    {impressumHtml}
                                </pre>
                                <div style={{ marginTop: 16 }}>
                                    <Button
                                        onClick={copyHtml}
                                        style={{ background: "#2855d9" }}
                                    >
                                        {copiedHtml ? <Check /> : <Copy />} {copiedHtml ? "HTML kopiert!" : "HTML kopieren"}
                                    </Button>
                                </div>
                            </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
