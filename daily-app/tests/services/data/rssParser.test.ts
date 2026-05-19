import { describe, expect, it } from "vitest";
import { measureTextWrap } from "@evenrealities/pretext";
import { paginateText } from "../../../src/services/data/rssParser";

describe("paginateText", () => {
  it("keeps generated pages inside the G2 detail body pixel budget", () => {
    const text = Array.from({ length: 160 }, (_, index) => `Wort${index}`).join(" ");

    const pages = paginateText(text);

    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      expect(page.length).toBeLessThanOrEqual(480);
      expect(measureTextWrap(page, 568).height).toBeLessThanOrEqual(162);
    }
  });

  it("returns fallback text for empty content", () => {
    expect(paginateText("   ")).toEqual(["Keine Beschreibung verfuegbar."]);
  });
});
