import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createCase, expectOnCasePage, fixture, grantStation, snap } from './support/app.ts';
import { installFakeNano, mockCloud } from './support/fakes.ts';
import { blastObservation, expertAnswer, vote } from './support/scenarios.ts';

test.describe('extension station', () => {
  test.beforeEach(async ({ page }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: blastObservation,
      votes: [vote('rice_blast', 0.92), vote('rice_blast', 0.9), vote('rice_blast', 0.94)],
    });
  });

  test('explains how to get access when the account is not a station', async ({ page }) => {
    await mockCloud(page, {});
    await page.goto('/station');
    await expect(page.getByText('This account has no station access')).toBeVisible();
  });

  test('maps outbreaks, re-checks on the laptop and records a verdict the farmer sees', async ({ page }) => {
    await mockCloud(page, { expert: expertAnswer('rice_blast') });
    await createCase(page, { photos: ['rice-blast.jpg'], shareArea: true });
    await expectOnCasePage(page);
    await expect(page.locator('.expert .diagnosis')).toHaveText('Rice blast');

    await grantStation(page);
    await expect(page.getByRole('heading', { name: 'Extension station' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Outbreak map' })).toBeVisible();
    await expect(page.locator('path.hotspot-high')).toHaveCount(1);
    await expect(page.locator('.card').filter({ hasText: 'Cases by condition' })).toContainText('Rice blast');
    await snap(page, '08-station');

    await page.locator('.case-list a').first().click();
    await page.getByRole('button', { name: /Re-check on this device/ }).click();
    const recheck = page.locator('.card').filter({ hasText: 'Station re-check' });
    await expect(recheck.locator('.badge-on_device')).toBeVisible();
    await expect(recheck.locator('.diagnosis')).toHaveText('Rice blast');

    await page.getByLabel('Note for the farmer').fill('Confirmed in the field. Drain and stop urea.');
    await page.getByRole('button', { name: 'Save verdict' }).click();
    const review = page.locator('.review');
    await expect(review).toContainText('Officer verdict');
    await expect(review).toContainText('Confirmed in the field.');
    await snap(page, '09-officer-verdict');

    await page.getByRole('link', { name: 'My cases' }).click();
    await expect(page.locator('.case-list li').first()).toContainText('Officer reviewed');
  });

  test('evaluates labelled photos across the three set-ups and exports CSV', async ({ page }) => {
    const calls = await mockCloud(page, {
      observation: blastObservation,
      vote: vote('rice_blast', 0.9),
      expert: expertAnswer('rice_blast'),
    });
    await grantStation(page);
    await page.getByRole('link', { name: /Accuracy evaluation/ }).click();
    const photo = readFileSync(fixture('rice-blast.jpg'));
    await page.getByTestId('eval-files').setInputFiles([
      { name: 'rice_blast__001.jpg', mimeType: 'image/jpeg', buffer: photo },
      { name: 'brown_spot__002.jpg', mimeType: 'image/jpeg', buffer: photo },
      { name: 'unlabelled.jpg', mimeType: 'image/jpeg', buffer: photo },
    ]);
    await expect(page.getByTestId('eval-loaded')).toContainText('2 labelled photos');
    await expect(page.getByTestId('eval-loaded')).toContainText('1 skipped');

    await page.getByRole('button', { name: 'On-device only' }).click();
    await page.getByRole('button', { name: 'Cloud expert only' }).click();
    await page.getByRole('button', { name: 'Run evaluation' }).click();

    const table = page.getByTestId('eval-summary');
    await expect(table.locator('tbody tr')).toHaveCount(3, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Run evaluation' })).toBeVisible();
    const cascade = table.locator('tr').filter({ hasText: 'Hybrid cascade' });
    await expect(cascade).toContainText('50%');
    await expect(table.locator('tr').filter({ hasText: 'On-device only' })).toContainText('100%');
    await snap(page, '10-evaluation');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV' }).click();
    const csv = readFileSync(await (await download).path(), 'utf8');
    expect(csv.split('\n')[0]).toBe('file,label,config,predicted,correct,top3,answered_by,escalated,cloud_calls,ms,error');
    expect(csv.trim().split('\n')).toHaveLength(7);
    // Cascade escalates rice blast (high severity) twice; cloud-only calls the expert twice.
    expect(calls.expert).toBe(4);
  });
});
