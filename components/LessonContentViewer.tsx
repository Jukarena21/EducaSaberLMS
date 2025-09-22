'use client';

interface LessonContentViewerProps {
  content: string;
  className?: string;
}

export function LessonContentViewer({ content, className = "" }: LessonContentViewerProps) {
  return (
    <div 
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
