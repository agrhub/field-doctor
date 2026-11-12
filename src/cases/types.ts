import type { Timestamp } from 'firebase/firestore';
import type { CaseContext, ExpertResult, RoutingDecision, Tier1Result } from '../ai/types';

export type CaseStatus =
  /** Tier 1 accepted; nothing more to do unless the farmer asks. */
  | 'triaged'
  /** Waiting for the expert tier (offline queue or in progress). */
  | 'pending_cloud'
  /** Expert tier finished. */
  | 'diagnosed'
  /** An extension officer reviewed it. */
  | 'reviewed';

export interface Review {
  byUid: string;
  conditionId: string;
  note: string;
  at: Timestamp;
}

export interface StationCheck {
  byUid: string;
  tier1: Tier1Result;
  decision: RoutingDecision;
  at: Timestamp;
}

export interface CaseDoc {
  ownerUid: string;
  cropId: string;
  lang: 'vi' | 'en';
  context: CaseContext;
  shotIds: string[];
  /** Storage paths, filled once photos are uploaded. */
  photoPaths: string[];
  /** Approximate area (2 decimals ≈ 1 km) for the community outbreak map. */
  area: { lat: number; lng: number } | null;
  tier1: Tier1Result;
  decision: RoutingDecision;
  status: CaseStatus;
  expert: ExpertResult | null;
  cloud: { attempts: number; lastError: string | null };
  review?: Review;
  stationCheck?: StationCheck;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CaseRecord extends CaseDoc {
  id: string;
  /** True while the document only exists in the local offline cache. */
  pendingSync: boolean;
}
