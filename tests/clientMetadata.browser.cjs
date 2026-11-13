// Use only a local server with an isolated SQLite data directory.
const {chromium} = require(process.env.RECHLY_PLAYWRIGHT_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const origin = process.env.RECHLY_CLIENT_TEST_URL || 'http://127.0.0.1:3123';
(async () => {
    assert.equal(process.env.RECHLY_DATA_DIR, '/tmp/rechly-client-metadata-test');
    assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
    const browser = await chromium.launch({executablePath:process.env.RECHLY_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
    try {
        const page = await browser.newPage();
        assert.equal((await (await page.request.get(origin + '/api/desktop/health')).json()).storage,'sqlite');
        await page.goto(origin + '/dashboard/clients');
        await page.getByRole('button',{name:/Neuer Kunde/}).click();
        const modal = page.getByRole('dialog');
        const name = 'Delivery test ' + Date.now();
        for (const [field,value] of Object.entries({name,address_line1:'Rechnungsstraße 1',postal_code:'10115',city:'Berlin'})) await modal.locator('#' + field).fill(value);
        await modal.getByText('Erweiterte E-Rechnungsangaben (optional)',{exact:true}).click();
        await modal.getByRole('button',{name:/Lieferort hinzufügen/}).click();
        const address = {name:'Lager',street:'Lieferstraße 12',postal_code:'50667',city:'Köln',country:'DE'};
        for (const [field,value] of Object.entries(address)) await modal.locator('#e_invoice_delivery_locations_0_' + field).fill(value);
        const [created] = await Promise.all([
            page.waitForResponse(r => r.url().endsWith('/api/clients') && r.request().method() === 'POST'),
            modal.getByRole('button',{name:'Erstellen',exact:true}).click(),
        ]);
        assert.equal(created.status(),200); const client = await created.json();
        assert.deepEqual(client.e_invoice.delivery_locations,[address]);
        await page.reload();
        await page.getByRole('row').filter({hasText:name}).getByRole('button',{name:'edit',exact:true}).click();
        await modal.getByText('Erweiterte E-Rechnungsangaben (optional)',{exact:true}).click();
        assert.equal(await modal.locator('#e_invoice_delivery_locations_0_street').inputValue(),address.street);
        await modal.locator('#e_invoice_delivery_locations_0_street').fill('Neue Lieferstraße 20');
        const failedMessage = 'Lieferadressen und E-Rechnungsdaten können derzeit nicht gespeichert werden. Ihre Eingaben bleiben erhalten.';
        await page.route('**/api/clients/' + client.id, route => route.request().method() === 'PUT'
            ? route.fulfill({status:503,json:{error:failedMessage,code:'client_metadata_unavailable'}}) : route.continue());
        await modal.getByRole('button',{name:/Speichern$/}).click();
        await page.getByText(failedMessage,{exact:true}).waitFor();
        assert.equal(await modal.locator('#e_invoice_delivery_locations_0_street').inputValue(),'Neue Lieferstraße 20');
        assert.equal((await (await page.request.get(origin + '/api/clients/' + client.id)).json()).e_invoice.delivery_locations[0].street,address.street);
        await page.unroute('**/api/clients/' + client.id);
        const [updated] = await Promise.all([
            page.waitForResponse(r => r.url().endsWith('/api/clients/' + client.id) && r.request().method() === 'PUT'),
            modal.getByRole('button',{name:/Speichern$/}).click(),
        ]);
        assert.equal(updated.status(),200);
        await page.reload();
        assert.equal((await (await page.request.get(origin + '/api/clients/' + client.id)).json()).e_invoice.delivery_locations[0].street,'Neue Lieferstraße 20');
        console.log('PASS: delivery address create/reload/edit, failed save preserves input and stored address, retry persists changes.');
    } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
