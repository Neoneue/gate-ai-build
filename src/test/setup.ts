import { vi } from "vitest";

/**
 * Pin the wall clock for every test file.
 *
 * `src/lib/demo-clock.ts` shifts each authored mock date forward by the
 * number of real days since 2026-06-06, at module load, so the site always
 * reads as "used through yesterday". That is the product behaviour and it
 * stays. In tests it meant every count that depends on a calendar boundary
 * (seats present on the 1st, buckets per month) could change overnight; two
 * literal assertions in `billing-enterprise.test.ts` broke on 2026-09-17
 * with no code change.
 *
 * Only `Date` is faked, so timers, promises and `performance` behave as
 * normal. The pin is the last day the whole suite was green against real
 * time; move it deliberately, never by accident.
 */
vi.useFakeTimers({ now: new Date(2026, 8, 17, 12, 0, 0), toFake: ["Date"] });
