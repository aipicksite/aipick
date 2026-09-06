import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

// Renders blog_posts.body (markdown) into properly structured HTML —
// headings, bullet lists, tables, bold/italic, links, and images all get
// real elements instead of being dumped as plain text.
export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="font-body text-[15px] leading-relaxed text-ink/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display font-bold text-2xl mt-10 mb-4 text-ink">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display font-bold text-xl mt-10 mb-3 text-ink">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display font-semibold text-lg mt-8 mb-2.5 text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4">{children}</p>,
          a: ({ href, children }) => {
            const isInternal = href?.startsWith("/") || href?.startsWith("https://aipick.site");
            if (isInternal && href) {
              const path = href.replace("https://aipick.site", "") || "/";
              return (
                <Link href={path} className="text-plum hover:underline font-medium">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-plum hover:underline font-medium"
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-5 flex flex-col gap-2 marker:text-plum">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-5 flex flex-col gap-2 marker:text-plum marker:font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-plum pl-4 italic text-ink/65 my-5">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-line my-10" />,
          code: ({ children }) => (
            <code className="bg-surface border border-line rounded px-1.5 py-0.5 text-[13px] font-mono">
              {children}
            </code>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ""}
                loading="lazy"
                className="w-full rounded-lg border border-line my-6"
              />
            ) : null,
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 border border-line rounded-lg">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left font-display font-semibold px-4 py-2.5 border-b border-line whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-line align-top">{children}</td>
          ),
          tr: ({ children }) => <tr className="even:bg-surface/50">{children}</tr>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
