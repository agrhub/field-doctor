import type { Page, Route } from '@playwright/test';

/** A model answer in the snake_case JSON the app's schemas request. */
export type Json = Record<string, unknown>;

export interface NanoScenario {
  /** 'absent' = browser without the Prompt API at all. */
  availability: 'available' | 'downloadable' | 'unavailable' | 'absent';
  observation?: Json;
  votes?: Json[];
}

/**
 * Simulated Chrome Prompt API (`LanguageModel`). The Firebase AI Logic SDK
 * drives it exactly like the real Gemini Nano; answers honour the JSON schema
 * passed as `responseConstraint`.
 */
export async function installFakeNano(page: Page, scenario: NanoScenario): Promise<void> {
  await page.addInitScript((s: NanoScenario) => {
    const w = window as unknown as Record<string, unknown>;
    w.__nanoCalls = 0;
    if (s.availability === 'absent') return;
    let state: string = s.availability;
    let vote = 0;
    const session = {
      async prompt(_messages: unknown, options?: { responseConstraint?: { properties?: Record<string, unknown> } }) {
        w.__nanoCalls = (w.__nanoCalls as number) + 1;
        await new Promise((r) => setTimeout(r, 40));
        const props = options?.responseConstraint?.properties ?? {};
        if ('organs' in props) return JSON.stringify(s.observation);
        if ('second_choice' in props) {
          const votes = s.votes ?? [];
          return JSON.stringify(votes[vote++ % votes.length]);
        }
        return '{}';
      },
      destroy() {},
    };
    w.LanguageModel = {
      async availability() {
        return state;
      },
      async create(options?: { monitor?: (m: unknown) => void }) {
        if (state === 'downloadable' || state === 'downloading') {
          state = 'downloading';
          const listeners: ((e: { loaded: number }) => void)[] = [];
          options?.monitor?.({
            addEventListener: (_: string, f: (e: { loaded: number }) => void) => listeners.push(f),
            removeEventListener() {},
          });
          for (const loaded of [0.25, 0.6, 1]) {
            await new Promise((r) => setTimeout(r, 200));
            listeners.forEach((f) => f({ loaded }));
          }
          state = 'available';
        }
        if (state === 'unavailable') throw new Error('unavailable');
        return session;
      },
    };
  }, scenario);
}

export interface CloudScenario {
  observation?: Json;
  vote?: Json;
  expert?: Json;
  advisory?: string;
  /** Fail the first N expert requests with HTTP 500. */
  failExpert?: number;
}

export interface CloudCalls {
  observe: number;
  classify: number;
  expert: number;
  advisory: number;
}

function geminiResponse(text: string, extra: Json = {}): Json {
  return {
    candidates: [{ index: 0, content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP', ...extra }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 },
  };
}

/**
 * Simulated cloud Gemini behind Firebase AI Logic. Requests made by the real
 * SDK are intercepted and answered according to the schema they ask for.
 * All other Google endpoints (Remote Config, fonts, map tiles) are cut off,
 * as on a farm with no data plan.
 */
export async function mockCloud(page: Page, scenario: CloudScenario): Promise<CloudCalls> {
  const calls: CloudCalls = { observe: 0, classify: 0, expert: 0, advisory: 0 };
  let expertFailures = scenario.failExpert ?? 0;

  // Match on the host only: emulator URLs contain "googleapis.com" in their path.
  await page.route(/^https:\/\/[^/]*(googleapis\.com|gstatic\.com|openstreetmap\.org)\//, (route) => route.abort());
  await page.route(/^https:\/\/firebasevertexai\.googleapis\.com\//, async (route: Route) => {
    const body = route.request().postDataJSON() as Json;
    const tools = (body.tools ?? []) as Json[];
    const schema = (body.generationConfig as Json | undefined)?.responseJsonSchema as Json | undefined;
    const props = (schema?.properties ?? {}) as Json;

    if (tools.some((t) => 'googleSearch' in t)) {
      calls.advisory++;
      return route.fulfill({
        json: geminiResponse(scenario.advisory ?? '- No current advisories.', {
          groundingMetadata: {
            webSearchQueries: ['rice blast advisory Vietnam'],
            searchEntryPoint: { renderedContent: '<div class="chip">rice blast advisory Vietnam</div>' },
            groundingChunks: [{ web: { uri: 'https://example.org/advisory', title: 'Plant Protection Department' } }],
          },
        }),
      });
    }
    if ('organs' in props) {
      calls.observe++;
      return route.fulfill({ json: geminiResponse(JSON.stringify(scenario.observation)) });
    }
    if ('second_choice' in props) {
      calls.classify++;
      return route.fulfill({ json: geminiResponse(JSON.stringify(scenario.vote)) });
    }
    if ('ipm' in props) {
      calls.expert++;
      if (expertFailures > 0) {
        expertFailures--;
        return route.fulfill({ status: 500, json: { error: { code: 500, message: 'Simulated outage', status: 'INTERNAL' } } });
      }
      return route.fulfill({ json: geminiResponse(JSON.stringify(scenario.expert)) });
    }
    return route.fulfill({ status: 400, json: { error: { code: 400, message: 'Unexpected request in test', status: 'INVALID_ARGUMENT' } } });
  });
  return calls;
}
