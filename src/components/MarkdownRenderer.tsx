import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-xs text-foreground leading-relaxed">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
