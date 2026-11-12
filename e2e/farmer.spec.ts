import { expect, test } from '@playwright/test';
import { createCase, expectOnCasePage, snap } from './support/app.ts';
import { installFakeNano, mockCloud } from './support/fakes.ts';
import {
  blastObservation,
  expertAnswer,
  leafFolderObservation,
  phytophthoraObservation,
  vote,
} from './support/scenarios.ts';

test.describe('farmer app', () => {
  test('renders the home screen and switches between English and Vietnamese', async ({ page }) => {
    await installFakeNano(page, { availability: 'available' });
    await mockCloud(page, {});
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Field Doctor' })).toBeVisible();
    await expect(page.getByText('Gemini Nano is ready')).toBeVisible();
    await snap(page, '01-home');
    await page.getByRole('button', { name: 'Language' }).click();
    await expect(page.getByRole('link', { name: 'Kiểm tra mới' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bác sĩ Đồng ruộng' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: 'Kiểm tra mới' })).toBeVisible();
  });

  test('flags a blurry photo before any model runs', async ({ page }) => {
    await installFakeNano(page, { availability: 'available' });
    await mockCloud(page, {});
    await page.goto('/new');
    await page.locator('.slot input[type=file]').first().setInputFiles('e2e/fixtures/blurry.jpg');
    await expect(page.locator('.quality-blurry')).toHaveText('Blurry — please retake');
    await page.locator('.slot input[type=file]').first().setInputFiles('e2e/fixtures/rice-blast.jpg');
    await expect(page.locator('.quality-ok')).toBeVisible();
    await snap(page, '02-capture');
  });

  test('answers on-device with no cloud call when the small model is confident', async ({ page }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: leafFolderObservation,
      votes: [vote('rice_leaf_folder', 0.94), vote('rice_leaf_folder', 0.9), vote('rice_leaf_folder', 0.92)],
    });
    const calls = await mockCloud(page, {});
    await createCase(page, { photos: ['rice-leaf-folder.jpg'] });
    await expectOnCasePage(page);

    const firstLook = page.locator('.card').filter({ hasText: 'First look' });
    await expect(firstLook.locator('.diagnosis')).toHaveText('Rice leaf folder');
    await expect(firstLook.locator('.badge-on_device')).toBeVisible();
    await expect(firstLook).toContainText('3 votes');
    await expect(page.locator('.routing-accept')).toContainText('reliable enough');
    await expect(firstLook).toContainText('no spraying needed in the first 40 days');
    await snap(page, '03-on-device-result');
    expect(await page.evaluate(() => (window as unknown as { __nanoCalls: number }).__nanoCalls)).toBe(4);
    expect(calls).toEqual({ observe: 0, classify: 0, expert: 0, advisory: 0 });

    // The farmer can still ask for a second opinion.
    await page.unroute(/^https:\/\/firebasevertexai\.googleapis\.com\//);
    const second = await mockCloud(page, { expert: expertAnswer('rice_leaf_folder', { severity: 'medium' }) });
    await page.getByRole('button', { name: 'Ask the cloud expert' }).click();
    await expect(page.locator('.expert .diagnosis')).toHaveText('Rice leaf folder');
    expect(second.expert).toBe(1);
  });

  test('escalates a dangerous disease to the cloud expert with located evidence and advisories', async ({ page }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: blastObservation,
      votes: [vote('rice_blast', 0.93, 'brown_spot'), vote('rice_blast', 0.9, 'brown_spot'), vote('rice_blast', 0.95)],
    });
    const calls = await mockCloud(page, {
      expert: expertAnswer('rice_blast'),
      advisory: '- Blast warnings issued for the winter–spring crop.\n- Avoid excess nitrogen.',
    });
    await createCase(page, { photos: ['rice-blast.jpg', 'rice-leaf-folder.jpg'] });
    await expectOnCasePage(page);

    await expect(page.locator('.routing-escalate')).toContainText('dangerous condition, second opinion');
    await expect(page.getByText('This can spread fast')).toBeVisible();
    const expert = page.locator('.expert');
    await expect(expert.locator('.diagnosis')).toHaveText('Rice blast');
    await expect(expert.locator('.evidence-box')).toHaveCount(2);
    await expect(expert).toContainText('Brown spot');
    await expect(expert).toContainText('Use resistant varieties next season.');
    await expect(expert).toContainText('Ask an extension officer to visit the field.');

    await expert.getByRole('button', { name: 'Find current advisories' }).click();
    await expect(expert).toContainText('Blast warnings issued');
    await expect(expert.getByRole('link', { name: 'Plant Protection Department' })).toBeVisible();
    await expect(expert.locator('iframe.search-entry')).toBeVisible();
    await snap(page, '04-expert-result');
    expect(calls).toMatchObject({ observe: 0, classify: 0, expert: 1, advisory: 1 });
  });

  test('falls back to cloud Gemini with the same code when the device has no local model', async ({ page }) => {
    await installFakeNano(page, { availability: 'absent' });
    const calls = await mockCloud(page, {
      observation: leafFolderObservation,
      vote: vote('rice_leaf_folder', 0.92),
    });
    await page.goto('/');
    await expect(page.getByText('No on-device AI here')).toBeVisible();
    await createCase(page, { photos: ['rice-leaf-folder.jpg'] });
    await expectOnCasePage(page);
    const firstLook = page.locator('.card').filter({ hasText: 'First look' });
    await expect(firstLook.locator('.badge-in_cloud')).toBeVisible();
    await expect(firstLook).toContainText('1 votes');
    await snap(page, '05-cloud-fallback');
    // One observation + one vote: no extra self-consistency votes are paid for in the cloud.
    expect(calls).toMatchObject({ observe: 1, classify: 1, expert: 0 });
  });

  test('shows the error and recovers when the expert tier fails', async ({ page }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: blastObservation,
      votes: [vote('rice_blast', 0.9)],
    });
    const calls = await mockCloud(page, { expert: expertAnswer('rice_blast'), failExpert: 1 });
    await createCase(page, { photos: ['rice-blast.jpg'] });
    await expectOnCasePage(page);
    await expect(page.getByText('Could not analyse yet:')).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.locator('.expert .diagnosis')).toHaveText('Rice blast');
    expect(calls.expert).toBe(2);
  });

  test('downloads the on-device model from a user click', async ({ page }) => {
    await installFakeNano(page, { availability: 'downloadable' });
    await mockCloud(page, {});
    await page.goto('/');
    await expect(page.getByText('This device can run Gemini Nano')).toBeVisible();
    await page.getByRole('button', { name: 'Download model' }).click();
    await expect(page.getByText('Gemini Nano is ready')).toBeVisible();
  });

  test('works for durian with crop-specific photo guidance', async ({ page }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: phytophthoraObservation,
      votes: [vote('phytophthora', 0.9), vote('phytophthora', 0.88), vote('phytophthora', 0.91)],
    });
    await mockCloud(page, {
      expert: expertAnswer('phytophthora', { summary: 'Stem canker with oozing sap.', differential: [], evidence: [] }),
    });
    await page.goto('/new');
    await page.getByLabel('Crop').selectOption('durian');
    await expect(page.getByText('Trunk base / fruit')).toBeVisible();
    await createCase(page, { crop: 'durian', photos: ['durian-trunk.jpg'] });
    await expectOnCasePage(page);
    await expect(page.locator('.diagnosis').first()).toContainText('Phytophthora');
    await expect(page.getByText('Open drainage channels')).toBeVisible();
    await expect(page.locator('.expert .diagnosis')).toContainText('Phytophthora');
  });

  test('lists past cases with their status', async ({ page }) => {
    await installFakeNano(page, {
      availability: 'available',
      observation: leafFolderObservation,
      votes: [vote('rice_leaf_folder', 0.95)],
    });
    await mockCloud(page, {});
    await createCase(page, { photos: ['rice-leaf-folder.jpg'] });
    await expectOnCasePage(page);
    await page.getByRole('link', { name: 'My cases' }).click();
    const item = page.locator('.case-list li').first();
    await expect(item).toContainText('Rice leaf folder');
    await expect(item).toContainText('Triaged');
    await expect(item.locator('.badge-on_device')).toBeVisible();
  });
});
