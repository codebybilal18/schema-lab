import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          p: (props) => <p {...props} />,
          ul: (props) => (
            <ul className="list-disc space-y-1 pl-5" {...props} />
          ),
          ol: (props) => (
            <ol className="list-decimal space-y-1 pl-5" {...props} />
          ),
          code: (props) => (
            <code
              className="bg-muted rounded px-1 py-0.5 font-mono text-xs"
              {...props}
            />
          ),
          strong: (props) => <strong className="font-semibold" {...props} />,
          h1: (props) => <h1 className="text-lg font-semibold" {...props} />,
          h2: (props) => <h2 className="text-base font-semibold" {...props} />,
          h3: (props) => <h3 className="text-sm font-semibold" {...props} />,
          a: (props) => (
            <a className="underline" target="_blank" rel="noreferrer" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
