"use client";

import "@assistant-ui/react-markdown/styles/dot.css";

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import { CheckIcon, CopyIcon } from "lucide-react";
import { type FC, memo, useState } from "react";
import remarkGfm from "remark-gfm";

import { TooltipIconButton } from "./tooltip-icon-button";
import { cn } from "../../utils";

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      className="aui-md"
      components={defaultComponents}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase [&>span]:text-xs">{language}</span>
      <TooltipIconButton tooltip="Copy" onClick={onCopy}>
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

const defaultComponents = memoizeMarkdownComponents({
  h1: ({ className, ...props }: { className?: string }) => (
    <h1 className={cn("text-[1.25rem] font-bold leading-tight tracking-tight mt-5 mb-2", className)} {...props} />
  ),
  h2: ({ className, ...props }: { className?: string }) => (
    <h2 className={cn("text-[1.1rem] font-semibold leading-tight tracking-tight mt-4 mb-1.5", className)} {...props} />
  ),
  h3: ({ className, ...props }: { className?: string }) => (
    <h3 className={cn("text-[1rem] font-semibold leading-tight mt-3.5 mb-1.5", className)} {...props} />
  ),
  h4: ({ className, ...props }: { className?: string }) => (
    <h4 className={cn("text-[0.9375rem] font-semibold leading-tight mt-3 mb-1", className)} {...props} />
  ),
  h5: ({ className, ...props }: { className?: string }) => (
    <h5 className={cn("text-[0.875rem] font-semibold leading-tight mt-2.5 mb-1", className)} {...props} />
  ),
  h6: ({ className, ...props }: { className?: string }) => (
    <h6 className={cn("text-[0.875rem] font-semibold leading-tight mt-2 mb-1", className)} {...props} />
  ),
  p: ({ className, ...props }: { className?: string }) => (
    <p className={cn("text-[0.875rem] leading-[1.55] my-1", className)} {...props} />
  ),
  a: ({ className, ...props }: { className?: string }) => (
    <a className={cn("text-blue-500 underline underline-offset-2 hover:text-blue-400 transition-colors", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: { className?: string }) => (
    <blockquote className={cn("border-l-4 border-zinc-700 pl-3 italic text-zinc-400 my-2", className)} {...props} />
  ),
  ul: ({ className, ...props }: { className?: string }) => (
    <ul className={cn("list-disc ml-5 my-1 space-y-0.5 leading-[1.55]", className)} {...props} />
  ),
  ol: ({ className, ...props }: { className?: string }) => (
    <ol className={cn("list-decimal ml-5 my-1 space-y-0.5 leading-[1.55]", className)} {...props} />
  ),
  hr: ({ className, ...props }: { className?: string }) => (
    <hr className={cn("my-4 border-zinc-700", className)} {...props} />
  ),
  table: ({ className, ...props }: { className?: string }) => (
    <table className={cn("my-4 w-full border-collapse text-[0.875rem]", className)} {...props} />
  ),
  th: ({ className, ...props }: { className?: string }) => (
    <th className={cn("bg-zinc-800 px-3 py-1.5 text-left font-semibold", className)} {...props} />
  ),
  td: ({ className, ...props }: { className?: string }) => (
    <td className={cn("border-t border-zinc-700 px-3 py-1.5", className)} {...props} />
  ),
  tr: ({ className, ...props }: { className?: string }) => (
    <tr className={cn("border-b border-zinc-700", className)} {...props} />
  ),
  sup: ({ className, ...props }: { className?: string }) => (
    <sup className={cn("text-xs", className)} {...props} />
  ),
  pre: ({ className, ...props }: { className?: string }) => (
    <pre className={cn("overflow-x-auto rounded-lg bg-zinc-900 p-3 text-[0.875rem] text-zinc-100 my-2.5", className)} {...props} />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(!isCodeBlock && "bg-muted rounded border font-semibold text-[0.8125rem]", className)}
        {...props}
      />
    );
  },
  CodeHeader,
});
