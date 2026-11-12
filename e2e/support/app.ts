import { expect, type Page } from '@playwright/test';
import path from 'node:path';

export const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', name);

/** Saves a screenshot for the docs when SCREENSHOTS=1. */
export async function snap(page: Page, name: string): Promise<void> {
  if (process.env.SCREENSHOTS !== '1') return;
  // A sticky header would be painted mid-page in a full-page capture.
  await page.addStyleTag({ content: '.topbar { position: static !important; }' });
  await page.screenshot({ path: path.join(import.meta.dirname, '..', '..', 'docs', 'screenshots', `${name}.png`), fullPage: true });
}

export interface NewCaseOptions {
  crop?: 'rice' | 'durian';
  photos: string[];
  shareArea?: boolean;
}

/** Fills in the guided capture form and runs the analysis. */
export async function createCase(page: Page, { crop = 'rice', photos, shareArea = false }: NewCaseOptions): Promise<void> {
  // Navigate inside the app (works offline); load it first if needed.
  if (page.url().startsWith('http')) await page.getByRole('link', { name: 'New check' }).click();
  else await page.goto('/new');
  await page.getByLabel('Crop').selectOption(crop);
  const inputs = page.locator('.slot input[type=file]');
  for (const [i, photo] of photos.entries()) {
    await inputs.nth(i).setInputFiles(fixture(photo));
    await expect(page.locator('.slot').nth(i).locator('.quality')).toBeVisible();
  }
  if (shareArea) await page.getByLabel(/Share approximate area/).check();
  await page.getByRole('button', { name: 'Analyze' }).click();
}

export async function expectOnCasePage(page: Page): Promise<void> {
  await page.waitForURL(/\/case\//, { timeout: 30_000 });
  await expect(page.locator('.diagnosis').first()).toBeVisible();
}

export async function currentUid(page: Page): Promise<string> {
  await page.goto('/station');
  const code = page.locator('.notice code');
  await expect(code).not.toHaveText('…');
  return (await code.textContent())!.trim();
}

export async function grantStation(page: Page): Promise<void> {
  const uid = await currentUid(page);
  await page.evaluate((u) => (window as unknown as { __fieldDoctorTest: { grantStation(u: string): void } }).__fieldDoctorTest.grantStation(u), uid);
  await page.waitForTimeout(300);
  await page.reload();
}

/** First launch happens with signal: wait for the anonymous session, then go home. */
export async function signInOnline(page: Page): Promise<void> {
  await currentUid(page);
  await page.getByRole('link', { name: 'Field Doctor' }).click();
}
