import { afterEach, describe, expect, it } from "vitest";
import {
  __setDemoShiftDaysForTests,
  AUTHORED_TODAY,
  authoredDate,
  authoredDayLabel,
  DEMO_NOW,
  DEMO_SHIFT_DAYS,
  DEMO_TODAY,
  demoAnchorFields,
  parseAuthoredDayTime,
  parseAuthoredEventTime,
  shiftAuthored,
} from "@/lib/demo-clock";

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

describe("demo-clock", () => {
  afterEach(() => __setDemoShiftDaysForTests(null));

  it("computes an integer whole-day shift", () => {
    expect(Number.isInteger(DEMO_SHIFT_DAYS)).toBe(true);
  });

  it("maps authored today onto real yesterday at local midnight", () => {
    const realToday = new Date();
    realToday.setHours(0, 0, 0, 0);
    const yesterday = new Date(realToday);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(DEMO_TODAY.getTime()).toBe(yesterday.getTime());
    expect(shiftAuthored(AUTHORED_TODAY).getTime()).toBe(DEMO_TODAY.getTime());
  });

  it("preserves hour, minute and second through the shift", () => {
    const d = authoredDate(2026, 4, 12, 9, 9, 42);
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([9, 9, 42]);
    const shifted = shiftAuthored(new Date(2026, 2, 22, 23, 59, 59));
    expect([
      shifted.getHours(),
      shifted.getMinutes(),
      shifted.getSeconds(),
    ]).toEqual([23, 59, 59]);
  });

  it("keeps authored day distances intact", () => {
    const a = authoredDate(2026, 4, 12);
    const b = authoredDate(2026, 5, 6);
    expect(Math.round((b.getTime() - a.getTime()) / 86_400_000)).toBe(25);
  });

  it("DEMO_NOW is yesterday 18:30:12 and strictly in the past", () => {
    expect(sameLocalDay(DEMO_NOW, DEMO_TODAY)).toBe(true);
    expect([
      DEMO_NOW.getHours(),
      DEMO_NOW.getMinutes(),
      DEMO_NOW.getSeconds(),
    ]).toEqual([18, 30, 12]);
    expect(DEMO_NOW.getTime()).toBeLessThan(Date.now());
  });

  it("parses request day/time pairs onto the demo calendar", () => {
    const d = parseAuthoredDayTime("Jun 6", "00:50:51");
    expect(sameLocalDay(d, DEMO_TODAY)).toBe(true);
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 50, 51]);
  });

  it("parses stored event strings and round-trips through authoredDate", () => {
    expect(parseAuthoredEventTime("2026-05-12 09:09:42").getTime()).toBe(
      authoredDate(2026, 4, 12, 9, 9, 42).getTime()
    );
  });

  it("labels a shifted date in the authored 'Mon D' shape", () => {
    expect(authoredDayLabel(DEMO_TODAY)).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
    __setDemoShiftDaysForTests(0);
    expect(authoredDayLabel(parseAuthoredDayTime("Jun 6", "00:00:00"))).toBe(
      "Jun 6"
    );
  });

  it("demoAnchorFields mirrors DEMO_NOW", () => {
    const f = demoAnchorFields();
    expect(f.date.getTime()).toBe(DEMO_NOW.getTime());
    expect(f).toMatchObject({
      month: DEMO_NOW.getMonth(),
      day: DEMO_NOW.getDate(),
      hour: 18,
      minute: 30,
    });
  });

  it("shift override of 0 restores the authored calendar", () => {
    __setDemoShiftDaysForTests(0);
    expect(authoredDate(2026, 5, 6, 18, 30, 12).getTime()).toBe(
      new Date(2026, 5, 6, 18, 30, 12).getTime()
    );
  });
});
