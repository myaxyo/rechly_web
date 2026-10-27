export interface PartyIdentifier { value: string; scheme?: "0088" }
export interface DeliveryLocation {
    name: string;
    street: string;
    postal_code: string;
    city: string;
    country: string;
    identifier?: PartyIdentifier;
}
export interface EInvoiceData {
    buyer_identifier?: PartyIdentifier;
    seller_identifier?: PartyIdentifier;
    delivery_locations?: DeliveryLocation[];
    delivery?: DeliveryLocation;
}

export class IdentifierValidationError extends Error {}

export function validGTIN(value: string): boolean {
    if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
    let sum = 0;
    for (let i = value.length - 2, weight = 3; i >= 0; i--, weight = 4 - weight) {
        sum += Number(value[i]) * weight;
    }
    return (10 - sum % 10) % 10 === Number(value.at(-1));
}

export function parseGTIN(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string" || !validGTIN(value.trim())) {
        throw new IdentifierValidationError("GTIN: 8, 12, 13 oder 14 Ziffern mit gültiger Prüfziffer erforderlich.");
    }
    return value.trim();
}

function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new IdentifierValidationError("Ungültige E-Rechnungsdaten.");
    return value as Record<string, unknown>;
}
function string(value: unknown, max = 200): string {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string" || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) {
        throw new IdentifierValidationError("Ungültiger oder zu langer Text.");
    }
    return value.trim();
}
export function parseIdentifier(value: unknown): PartyIdentifier | undefined {
    if (value === undefined || value === null) return undefined;
    const data = object(value);
    const id = string(data.value);
    if (!id) return undefined;
    const scheme = string(data.scheme);
    if (scheme && scheme !== "0088") throw new IdentifierValidationError("Unterstütztes Schema: GLN (0088) oder ohne Schema.");
    if (scheme === "0088" && (id.length !== 13 || !validGTIN(id))) {
        throw new IdentifierValidationError("GLN: 13 Ziffern mit gültiger Prüfziffer erforderlich.");
    }
    return { value: id, ...(scheme ? { scheme: "0088" as const } : {}) };
}
function parseDelivery(value: unknown): DeliveryLocation {
    const data = object(value);
    const location = {
        name: string(data.name), street: string(data.street), postal_code: string(data.postal_code, 20),
        city: string(data.city), country: string(data.country, 2).toUpperCase(),
        identifier: parseIdentifier(data.identifier),
    };
    const countries = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
    if (!location.name || !location.street || !location.postal_code || !location.city || !countries.includes(location.country)) {
        throw new IdentifierValidationError("Lieferort: Name, Straße, PLZ, Ort und zweistelliges Länderkürzel erforderlich.");
    }
    return location;
}
export function parseEInvoiceData(value: unknown): EInvoiceData {
    if (value === undefined || value === null) return {};
    const data = object(value);
    const result: EInvoiceData = {};
    const buyer = parseIdentifier(data.buyer_identifier);
    const seller = parseIdentifier(data.seller_identifier);
    if (buyer) result.buyer_identifier = buyer;
    if (seller) result.seller_identifier = seller;
    if (data.delivery != null) result.delivery = parseDelivery(data.delivery);
    if (data.delivery_locations != null) {
        if (!Array.isArray(data.delivery_locations)) throw new IdentifierValidationError("Lieferorte müssen eine Liste sein.");
        result.delivery_locations = data.delivery_locations.map(parseDelivery);
    }
    if (JSON.stringify(result).length > 16000) throw new IdentifierValidationError("E-Rechnungsdaten überschreiten 16000 Zeichen.");
    return result;
}
export function readEInvoiceData(value: unknown): EInvoiceData {
    if (value === undefined || value === null || value === "") return {};
    return parseEInvoiceData(typeof value === "string" ? JSON.parse(value) : value);
}
/** Only persist on an explicit update; older clients preserve existing metadata. */
export function eInvoiceWrite(value: unknown): { eInvoiceData?: string } {
    return value === undefined ? {} : { eInvoiceData: JSON.stringify(parseEInvoiceData(value)) };
}

export function snapshotIdentifiers(client: EInvoiceData, company: EInvoiceData, override?: unknown): EInvoiceData {
    const supplied = override === undefined ? {} : object(override);
    return parseEInvoiceData({
        buyer_identifier: Object.hasOwn(supplied, "buyer_identifier") ? supplied.buyer_identifier : client.buyer_identifier,
        seller_identifier: company.seller_identifier,
        delivery: supplied.delivery,
    });
}
