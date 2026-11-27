"use client";
import HelpLink from "./HelpLink";

import { useLanguage } from "@/contexts/LanguageContext";
import { parseIdentifier, type EInvoiceData, type PartyIdentifier, type DeliveryLocation } from "@/lib/eRechnung/identifiers";
import { euCountryCodeOptions } from "@/lib/euCountries";
import { useState } from "react";
import { ChevronDown, MinusCircle, Plus } from "lucide-react";
import { Button as UiButton } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select as UiSelect, SelectContent as UiSelectContent, SelectItem as UiSelectItem,
    SelectTrigger as UiSelectTrigger, SelectValue as UiSelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function IdentifierFieldsControlled({ label, value, onChange }: {
    label: string;
    value?: PartyIdentifier;
    onChange: (value: PartyIdentifier | undefined) => void;
}) {
    const { t } = useLanguage();
    const [error, setError] = useState<string | undefined>();
    const update = (next: PartyIdentifier | undefined) => {
        try {
            const parsed = parseIdentifier(next as unknown);
            setError(undefined);
            onChange(parsed);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            onChange(next);
        }
    };
    return (
        <div className="flex flex-wrap items-start gap-3">
            <Field label={label} error={error}>
                <UiInput
                    value={value?.value ?? ""}
                    maxLength={200}
                    autoComplete="off"
                    className="w-56"
                    onChange={(e) => update(e.target.value ? { value: e.target.value, scheme: value?.scheme } : undefined)}
                />
            </Field>
            <Field label={t("einvoice.scheme")}>
                <UiSelect
                    value={value?.scheme ?? "none"}
                    onValueChange={(v) => update(value?.value ? { value: value.value, scheme: v === "0088" ? "0088" : undefined } : undefined)}
                >
                    <UiSelectTrigger className="w-[170px]"><UiSelectValue placeholder={t("einvoice.noScheme")} /></UiSelectTrigger>
                    <UiSelectContent>
                        <UiSelectItem value="none">{t("einvoice.noScheme")}</UiSelectItem>
                        <UiSelectItem value="0088">GLN · 0088</UiSelectItem>
                    </UiSelectContent>
                </UiSelect>
            </Field>
            <p className="w-full text-xs text-muted-foreground">{t("einvoice.identifierHelp")}</p>
        </div>
    );
}

export function DeliveryFieldsControlled({ value, onChange }: {
    value: DeliveryLocation;
    onChange: (value: DeliveryLocation) => void;
}) {
    const { t, language } = useLanguage();
    const set = (patch: Partial<DeliveryLocation>) => onChange({ ...value, ...patch });
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start gap-3">
                {(["name", "street", "postal_code", "city"] as const).map((field) => (
                    <Field key={field} label={t(`einvoice.${field}`)}>
                        <UiInput value={value[field] ?? ""} maxLength={200} className="w-48"
                            onChange={(e) => set({ [field]: e.target.value })} />
                    </Field>
                ))}
                <Field label={t("einvoice.country")}>
                    <UiSelect value={value.country || "DE"} onValueChange={(v) => set({ country: v })}>
                        <UiSelectTrigger className="w-[190px]"><UiSelectValue /></UiSelectTrigger>
                        <UiSelectContent>
                            {euCountryCodeOptions(language).map((o) => (
                                <UiSelectItem key={o.value} value={o.value}>{o.label}</UiSelectItem>
                            ))}
                        </UiSelectContent>
                    </UiSelect>
                </Field>
            </div>
            <IdentifierFieldsControlled
                label={t("einvoice.deliveryId")}
                value={value.identifier}
                onChange={(identifier) => set({ identifier })}
            />
        </div>
    );
}

/** Controlled shadcn/ui version used by migrated forms (clients, settings). */
export function EInvoiceFieldsControlled({ value, onChange, seller = false }: {
    value?: EInvoiceData;
    onChange: (value: EInvoiceData) => void;
    seller?: boolean;
}) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const data: EInvoiceData = value ?? {};
    const locations = data.delivery_locations ?? [];
    return (
        <Collapsible open={open} onOpenChange={setOpen} className="mb-6 rounded-lg border border-border">
            <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium">
                    {t("einvoice.advanced")}
                    <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-4 px-4 pb-4">
                <p className="text-sm text-muted-foreground">{t("einvoice.optionalHelp")}</p>
                <HelpLink href="/hilfe/e-rechnung-und-aufbewahrung#kennungen" label="Kennungen und Lieferorte erklärt" />
                <IdentifierFieldsControlled
                    label={t(seller ? "einvoice.sellerId" : "einvoice.buyerId")}
                    value={seller ? data.seller_identifier : data.buyer_identifier}
                    onChange={(identifier) =>
                        onChange(seller ? { ...data, seller_identifier: identifier } : { ...data, buyer_identifier: identifier })
                    }
                />
                {!seller && (
                    <div className="flex flex-col gap-4">
                        {locations.map((location, index) => (
                            <div key={index} className="flex flex-col gap-3 border-t border-border pt-4">
                                <DeliveryFieldsControlled
                                    value={location}
                                    onChange={(next) =>
                                        onChange({ ...data, delivery_locations: locations.map((l, i) => (i === index ? next : l)) })
                                    }
                                />
                                <UiButton type="button" variant="ghost" size="sm" className="self-start text-destructive"
                                    onClick={() => onChange({ ...data, delivery_locations: locations.filter((_, i) => i !== index) })}>
                                    <MinusCircle />
                                    {t("einvoice.removeLocation")}
                                </UiButton>
                            </div>
                        ))}
                        <UiButton type="button" variant="outline" size="sm" className="self-start border-dashed"
                            onClick={() => onChange({ ...data, delivery_locations: [...locations, { name: "", street: "", postal_code: "", city: "", country: "DE" }] })}>
                            <Plus />
                            {t("einvoice.addLocation")}
                        </UiButton>
                    </div>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
}

/** Controlled identifiers + delivery editor for the invoice create flow. */
export function InvoiceIdentifierEditor({ initial, value, onChange }: {
    initial?: EInvoiceData;
    value?: EInvoiceData;
    onChange: (value: EInvoiceData) => void;
}) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const data: EInvoiceData = value ?? { buyer_identifier: initial?.buyer_identifier };
    const locations = initial?.delivery_locations ?? [];
    const deliveryMode = data.delivery ? "custom" : undefined;

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="mt-4 rounded-lg border border-border">
            <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium">
                    {t("einvoice.advanced")}
                    <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-4 px-4 pb-4">
                <p className="text-sm text-muted-foreground">{t("einvoice.optionalHelp")}</p>
                <HelpLink href="/hilfe/e-rechnung-und-aufbewahrung#kennungen" label="Kennungen und Lieferorte erklärt" />
                <IdentifierFieldsControlled
                    label={t("einvoice.buyerId")}
                    value={data.buyer_identifier}
                    onChange={(buyer_identifier) => onChange({ ...data, buyer_identifier })}
                />
                <div className="flex flex-col gap-1.5">
                    <Label>{t("einvoice.delivery")}</Label>
                    <UiSelect
                        value={deliveryMode ?? "none"}
                        onValueChange={(v) => {
                            if (v === "none") {
                                const { delivery: _removed, ...rest } = data;
                                onChange(rest);
                            } else if (v === "custom") {
                                onChange({ ...data, delivery: { name: "", street: "", postal_code: "", city: "", country: "DE" } });
                            } else {
                                onChange({ ...data, delivery: locations[Number(v)] });
                            }
                        }}
                    >
                        <UiSelectTrigger className="w-full sm:w-[320px]"><UiSelectValue placeholder={t("einvoice.noDelivery")} /></UiSelectTrigger>
                        <UiSelectContent>
                            <UiSelectItem value="none">{t("einvoice.noDelivery")}</UiSelectItem>
                            {locations.map((location, i) => (
                                <UiSelectItem key={i} value={String(i)}>{location.name}</UiSelectItem>
                            ))}
                            <UiSelectItem value="custom">{t("einvoice.customDelivery")}</UiSelectItem>
                        </UiSelectContent>
                    </UiSelect>
                </div>
                {data.delivery && (
                    <DeliveryFieldsControlled
                        value={data.delivery}
                        onChange={(delivery) => onChange({ ...data, delivery })}
                    />
                )}
            </CollapsibleContent>
        </Collapsible>
    );
}
