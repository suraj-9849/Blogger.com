import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { createLowlight } from 'lowlight';
import { useHotkeys } from 'react-hotkeys-hook';

// Import languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';

// Create lowlight instance
const lowlight = createLowlight();

// Register languages
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('java', java);
lowlight.register('cpp', cpp);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('json', json);
lowlight.register('bash', bash);
lowlight.register('sql', sql);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Tell your story...",
  onImageUpload
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, 
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-lg my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-50 font-medium',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-4',
      },
      handlePaste: (_, event) => {
        const clipboardData = event.clipboardData?.getData('text/plain') || '';
        
        // Auto-detect code patterns
        const codePatterns = [
          /^(function|const|let|var|class|import|export)/m,
          /^(def|class|import|from|if __name__)/m,
          /^(public|private|protected|class|interface)/m,
          /^(#include|int main|std::)/m,
          /^(\{|\[|\<\w+\>)/m,
          /^(SELECT|INSERT|UPDATE|DELETE|CREATE)/im,
        ];
        
        const isCode = codePatterns.some(pattern => pattern.test(clipboardData));
        
        if (isCode && clipboardData.split('\n').length > 1) {
          event.preventDefault();
          
          const language = detectLanguage(clipboardData);
          editor?.chain().focus().insertContent({
            type: 'codeBlock',
            attrs: { language },
            content: [{
              type: 'text',
              text: clipboardData,
            }],
          }).run();
          
          return true;
        }
        
        return false;
      },
    },
  });

  // Detect programming language from code content
  const detectLanguage = (code: string): string => {
    if (code.includes('function') || code.includes('const ') || code.includes('=>')) return 'javascript';
    if (code.includes('interface') || code.includes(': string') || code.includes('type ')) return 'typescript';
    if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 'python';
    if (code.includes('public class') || code.includes('System.out')) return 'java';
    if (code.includes('#include') || code.includes('std::') || code.includes('int main')) return 'cpp';
    if (code.includes('SELECT') || code.includes('INSERT') || code.includes('CREATE TABLE')) return 'sql';
    if (code.includes('<div') || code.includes('<html') || code.includes('<!DOCTYPE')) return 'html';
    if (code.includes('{') && code.includes('}') && (code.includes('color:') || code.includes('margin:'))) return 'css';
    if (code.includes('#!/bin/bash') || code.includes('echo ') || code.includes('grep ')) return 'bash';
    return 'javascript';
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (onImageUpload) {
      try {
        const url = await onImageUpload(file);
        editor?.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  }, [editor, onImageUpload]);

  // Keyboard shortcuts
  useHotkeys('ctrl+b,cmd+b', (e) => {
    e.preventDefault();
    editor?.chain().focus().toggleBold().run();
  });

  useHotkeys('ctrl+i,cmd+i', (e) => {
    e.preventDefault();
    editor?.chain().focus().toggleItalic().run();
  });

  useHotkeys('ctrl+k,cmd+k', (e) => {
    e.preventDefault();
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  });

  useHotkeys('ctrl+shift+c,cmd+shift+c', (e) => {
    e.preventDefault();
    editor?.chain().focus().toggleCodeBlock().run();
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('bold') ? 'bg-gray-300' : ''
              }`}
              title="Bold (Ctrl+B)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('italic') ? 'bg-gray-300' : ''
              }`}
              title="Italic (Ctrl+I)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('strike') ? 'bg-gray-300' : ''
              }`}
              title="Strikethrough"
            >
              <span className="text-sm font-medium line-through">S</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('code') ? 'bg-gray-300' : ''
              }`}
              title="Inline Code"
            >
              <span className="text-sm font-mono font-medium">{`</>`}</span>
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
              }`}
              title="Heading 1"
            >
              <span className="text-sm font-bold">H1</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
              }`}
              title="Heading 2"
            >
              <span className="text-sm font-bold">H2</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
              }`}
              title="Heading 3"
            >
              <span className="text-sm font-bold">H3</span>
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('bulletList') ? 'bg-gray-300' : ''
              }`}
              title="Bullet List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('orderedList') ? 'bg-gray-300' : ''
              }`}
              title="Numbered List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Special Elements */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('codeBlock') ? 'bg-gray-300' : ''
              }`}
              title="Code Block (Ctrl+Shift+C)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('blockquote') ? 'bg-gray-300' : ''
              }`}
              title="Quote"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>

          {/* Link and Media */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('link') ? 'bg-gray-300' : ''
              }`}
              title="Add Link (Ctrl+K)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            
            <label className="p-2 rounded hover:bg-gray-200 cursor-pointer" title="Add Image">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      
      {/* Footer with shortcuts */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>Paste code to auto-format as code blocks</span>
          <div className="flex gap-4">
            <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+B</kbd> Bold</span>
            <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+I</kbd> Italic</span>
            <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+K</kbd> Link</span>
            <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Shift+C</kbd> Code Block</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor; 