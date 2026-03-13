"use client";

import Editor from "@monaco-editor/react";

export function SqlEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Editor
        height="240px"
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        loading={
          <div className="text-muted-foreground bg-muted flex h-[240px] items-center justify-center text-sm">
            Loading editor...
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          tabSize: 2,
        }}
      />
    </div>
  );
}
