import { expect, test } from '@playwright/test';
import { createCase, expectOnCasePage, signInOnline, snap } from './support/app.ts';
import { installFakeNano, mockCloud } from './support/fakes.ts';
import { blastObservation, expertAnswer, vote } from './support/scenarios.ts';

test.describe('offline in the field', () => {
  test('on-device model answers offline; the expert step is queued and runs when signal returns', async ({ page, context }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: blastObservation,
      votes: [vote('rice_blast', 0.92), vote('rice_blast', 0.9), vote('rice_blast', 0.93)],
    });
    const calls = await mockCloud(page, { expert: expertAnswer('rice_blast') });
    await signInOnline(page);
    await expect(page.locator('.net-on')).toBeVisible();

    await context.setOffline(true);
    await expect(page.locator('.net-off')).toBeVisible();
    await createCase(page, { photos: ['rice-blast.jpg'] });
    await expectOnCasePage(page);
    await expect(page.locator('.badge-on_device').first()).toBeVisible();
    await expect(page.getByText('Queued. It will be sent automatically')).toBeVisible();
    await snap(page, '06-offline-queued');
    expect(calls.expert).toBe(0);

    await context.setOffline(false);
    await expect(page.locator('.expert .diagnosis')).toHaveText('Rice blast', { timeout: 30_000 });
    expect(calls.expert).toBe(1);
  });

  test('without a local model, the symptom checklist works offline and the case completes later', async ({ page, context }) => {
    await installFakeNano(page, { availability: 'absent' });
    const calls = await mockCloud(page, { expert: expertAnswer('rice_blast') });
    await signInOnline(page);
    await expect(page.locator('.net-on')).toBeVisible();

    await context.setOffline(true);
    await createCase(page, { photos: ['rice-blast.jpg'] });
    await expect(page.getByRole('heading', { name: 'Symptom checklist' })).toBeVisible();
    for (const chip of ['Leaf', 'Grey-white centre', 'Diamond / spindle', 'Scattered spots']) {
      await page.getByRole('button', { name: chip, exact: true }).click();
    }
    await snap(page, '07-offline-checklist');
    await page.getByRole('button', { name: 'See result' }).click();
    await expectOnCasePage(page);

    const firstLook = page.locator('.card').filter({ hasText: 'First look' });
    await expect(firstLook.locator('.badge-manual')).toBeVisible();
    await expect(firstLook.locator('.diagnosis')).toHaveText('Rice blast');
    await expect(page.locator('.routing-escalate')).toContainText('checklist-only diagnosis');
    await expect(page.getByText('Queued.')).toBeVisible();

    await context.setOffline(false);
    await expect(page.locator('.expert .diagnosis')).toHaveText('Rice blast', { timeout: 30_000 });
    expect(calls.expert).toBe(1);
  });

  test.describe('installed app', () => {
    test.use({ serviceWorkers: 'allow' });

    test('opens with no connection after the first visit', async ({ page, context }) => {
      await installFakeNano(page, { availability: 'available' });
      await page.route(/^https:\/\/[^/]*(googleapis\.com|gstatic\.com)\//, (r) => r.abort());
      await page.goto('/');
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.reload();
      await expect(page.locator('.brand')).toBeVisible();

      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('.brand')).toBeVisible();
      await expect(page.locator('.net-off')).toBeVisible();
      await page.getByRole('link', { name: 'New check' }).click();
      await expect(page.getByRole('heading', { name: 'New check' })).toBeVisible();
    });
  });
});
