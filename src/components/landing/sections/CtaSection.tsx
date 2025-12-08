"use client";

import { useRouter } from "next/navigation";
import { Button, Typography } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;

export default function CtaSection() {
    const router = useRouter();
    const { t } = useLanguage();

    return (
        <section
            style={{
                padding: "64px 24px",
                background: "#fff",
                textAlign: "center",
            }}
        >
            <div style={{ maxWidth: 500, margin: "0 auto" }}>
                <h2
                    style={{
                        marginBottom: 12,
                        fontWeight: 600,
                        color: "#111",
                        fontSize: 24,
                    }}
                >
                    {t("cta.title")}
                </h2>
                <p
                    style={{
                        color: "#64748b",
                        marginBottom: 24,
                        fontSize: 16,
                    }}
                >
                    {t("cta.subtitle")}
                </p>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => router.push("/register")}
                    style={{
                        height: 48,
                        paddingInline: 32,
                        fontSize: 15,
                        borderRadius: 8,
                        fontWeight: 500,
                    }}
                    aria-label="Kostenlos registrieren und Rechnung erstellen"
                >
                    {t("cta.button")}
                </Button>
                <div style={{ marginTop: 16 }}>
                    <Text style={{ color: "#64748b", fontSize: 13 }}>
                        {t("cta.note")}
                    </Text>
                </div>
            </div>
        </section>
    );
}
