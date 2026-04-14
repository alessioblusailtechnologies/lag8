'use client';

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import styles from './markdown.module.scss';

const components: Components = {
  table: ({ children }) => (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className={styles.thead}>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className={styles.tr}>{children}</tr>,
  th: ({ children }) => <th className={styles.th}>{children}</th>,
  td: ({ children }) => <td className={styles.td}>{children}</td>,
  strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
  h1: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
  h2: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
  h3: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
  ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
  ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
  li: ({ children }) => <li className={styles.li}>{children}</li>,
  blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className={styles.codeBlock}>{children}</code>;
    }
    return <code className={styles.codeInline}>{children}</code>;
  },
  pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
  p: ({ children }) => <p className={styles.p}>{children}</p>,
  hr: () => <hr className={styles.hr} />,
};

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
