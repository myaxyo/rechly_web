"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { homeFaqsDe, homeFaqsEn } from "@/lib/home-faq";

const faqData = {
    de: homeFaqsDe,
    en: homeFaqsEn,
};

export default function FaqSection() {
    const { t, language } = useLanguage();
    const [openItem, setOpenItem] = useState<string | undefined>(undefined);

    return (
        <section
            style={{
                padding: "60px 24px 80px",
                background: "#fafafa",
            }}
            aria-label="Häufige Fragen zur Rechnungssoftware"
        >
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <h2
                    style={{
                        textAlign: "center",
                        marginBottom: 12,
                        fontWeight: 600,
                        color: "#111",
                        fontSize: 28,
                    }}
                >
                    {t("faq.title")}
                </h2>
                <p
                    style={{
                        textAlign: "center",
                        color: "#64748b",
                        marginBottom: 32,
                        fontSize: 16,
                    }}
                >
                    {t("faq.subtitle")}
                </p>

                <Accordion
                    type="single"
                    collapsible
                    value={openItem}
                    onValueChange={setOpenItem}
                >
                    {faqData[language].map((faq, i) => {
                        const isActive = openItem === String(i);
                        return (
                            <AccordionItem
                                key={i}
                                value={String(i)}
                                className="border-none"
                            >
                                <AccordionTrigger>
                                    <span className="flex items-center gap-2">
                                        <HelpCircle
                                            size={18}
                                            style={{
                                                color: "#2855d9",
                                                transform: isActive
                                                    ? "rotate(90deg)"
                                                    : "rotate(0deg)",
                                                transition:
                                                    "transform 0.2s ease",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                fontSize: 16,
                                                color: "#1f2937",
                                            }}
                                        >
                                            {faq.question}
                                        </span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p
                                        style={{
                                            color: "#64748b",
                                            lineHeight: 1.7,
                                            margin: 0,
                                        }}
                                    >
                                        {faq.answer}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </section>
    );
}
