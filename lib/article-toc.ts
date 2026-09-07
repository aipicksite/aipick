import GithubSlugger from "github-slugger";

export type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Pulls all H2/H3 headings out of a markdown string and slugs them with the
 * same algorithm rehype-slug uses internally (github-slugger), so the ids
 * here always match the ids MarkdownContent renders in the DOM.
 */
export function extractHeadings(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    items.push({ id: slugger.slug(text), text, level });
  }
  return items;
}

/**
 * Splits a markdown string right after the 2nd real paragraph (skipping
 * headings, images, etc.), so an inline widget (the Table of Contents) can
 * be dropped into the article body itself, not just the sidebar.
 * Falls back to putting the split point after the 1st block if the post is
 * short, and to the very end if there's no plain paragraph at all.
 */
export function splitAfterParagraphs(markdown: string, paragraphCount = 2) {
  const blocks = markdown.split(/\n\s*\n/);
  let seen = 0;
  let cutIndex = -1;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    const isPlainParagraph =
      block.length > 0 &&
      !/^#{1,6}\s/.test(block) &&
      !/^!\[/.test(block) &&
      !/^\|/.test(block) &&
      !/^(-|\*|\d+\.)\s/.test(block);
    if (isPlainParagraph) {
      seen++;
      if (seen >= paragraphCount) {
        cutIndex = i;
        break;
      }
    }
  }
  if (cutIndex === -1) {
    // Not enough plain paragraphs found — don't split, render as one block.
    return { intro: markdown, rest: "" };
  }
  return {
    intro: blocks.slice(0, cutIndex + 1).join("\n\n"),
    rest: blocks.slice(cutIndex + 1).join("\n\n"),
  };
}
