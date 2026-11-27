"use client";

import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";


export default function NotFound() {
    const router = useRouter();
    const { language } = useLanguage();
    const isDe = language === "de";

    return (
        <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
            <Navbar showAuth={false} />
            <main
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 24px",
                }}
            >
                <div style={{ maxWidth: 520, textAlign: "center" }}>
                    <div
                        style={{
                            display: "inline-grid",
                            placeItems: "center",
                            width: 88,
                            height: 88,
                            borderRadius: 10,
                            background: "#eef3fd",
                            color: "#2855d9",
                            fontSize: 34,
                            fontWeight: 800,
                            marginBottom: 28,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        404
                    </div>
                    <h2 className="text-3xl font-semibold" style={{ marginBottom: 8 }}>
                        {isDe ? "Seite nicht gefunden" : "Page not found"}
                    </h2>
                    <span
                        className="text-muted-foreground"
                        style={{ display: "block", fontSize: 15, marginBottom: 32 }}
                    >
                        {isDe
                            ? "Diese Seite existiert nicht oder wurde verschoben. Vielleicht finden Sie über die Suche oder die Startseite, was Sie suchen."
                            : "This page does not exist or has moved. Try the search or the homepage to find what you need."}
                    </span>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <Button
                            size="lg"
                            onClick={() => router.push("/")}
                        >
                            <Home size={16} />
                            {isDe ? "Zur Startseite" : "Go to homepage"}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => router.push("/tools")}
                        >
                            <Search size={16} />
                            {isDe ? "Rechner & Tools" : "Calculators & tools"}
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
