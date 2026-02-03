import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from "@/lib/utils";

interface RichTextProps {
    content: string;
    className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ content, className }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            className={cn("prose prose-slate max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2", className)}
            components={{
                img: ({ node, ...props }) => (
                    <img {...props} className="max-h-64 rounded-lg my-2 object-contain" />
                )
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
