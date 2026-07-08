import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rechly - Deutsche Rechnungssoftware";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "64px",
                background:
                    "linear-gradient(135deg, #f8fafc 0%, #dbeafe 48%, #bfdbfe 100%)",
                color: "#0f172a",
                fontFamily: "Arial",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                }}
            >
                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "18px",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "34px",
                        fontWeight: 700,
                    }}
                >
                    R
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            fontWeight: 700,
                        }}
                    >
                        Rechly
                    </div>
                    <div
                        style={{
                            fontSize: "18px",
                            color: "#334155",
                        }}
                    >
                        Rechnungssoftware für Deutschland
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    maxWidth: "900px",
                }}
            >
                <div
                    style={{
                        fontSize: "64px",
                        lineHeight: 1.06,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                    }}
                >
                    Rechnungen online schreiben.
                </div>
                <div
                    style={{
                        fontSize: "30px",
                        lineHeight: 1.3,
                        color: "#1e293b",
                    }}
                >
                    Für Freelancer, Selbstständige und kleine Unternehmen.
                    DSGVO-konform, Open Source und für den deutschen Markt
                    entwickelt.
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "22px",
                    color: "#1d4ed8",
                }}
            >
                <div>Rechnungen</div>
                <div>PDF-Export</div>
                <div>Kundenverwaltung</div>
                <div>Deutschland</div>
            </div>
        </div>,
        size,
    );
}
