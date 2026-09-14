/**
 * Extracts Q&A pairs for FAQPage schema from a "## Frequently Asked
 * Questions" section, where each question is an H3 ("### Question?") and
 * the answer is the plain-text paragraph(s) that follow until the next
 * heading. Returns [] if no FAQ section is found, so callers can safely
 * skip emitting FAQPage schema for articles that don't have one.
 */
export function extractFaqs(markdown: string): { question: string; answer: string }[] {
  const lines = markdown.split("\n");
  let inFaqSection = false;
  const faqs: { question: string; answer: string }[] = [];
  let currentQuestion: string | null = null;
  let currentAnswerLines: string[] = [];

  const flush = () => {
    if (currentQuestion) {
      const answer = currentAnswerLines.join(" ").replace(/\s+/g, " ").trim();
      if (answer) faqs.push({ question: currentQuestion, answer });
    }
    currentQuestion = null;
    currentAnswerLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const h2Match = /^##\s+(.*)$/.exec(line);
    if (h2Match) {
      if (inFaqSection) {
        // Hit the next H2 after the FAQ section — we're done.
        flush();
        break;
      }
      inFaqSection = /frequently asked questions|^faq/i.test(h2Match[1]);
      continue;
    }
    if (!inFaqSection) continue;

    const h3Match = /^###\s+(.*)$/.exec(line);
    if (h3Match) {
      flush();
      currentQuestion = h3Match[1].replace(/[*_`]/g, "").trim();
      continue;
    }
    if (currentQuestion && line) {
      currentAnswerLines.push(line.replace(/[*_`]/g, ""));
    }
  }
  flush();
  return faqs;
}
