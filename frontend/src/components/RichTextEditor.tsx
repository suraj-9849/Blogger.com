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
        HTMLAttributes: {
          class: 'not-prose rounded-lg bg-gray-900 p-4 my-4 overflow-x-auto',
          spellcheck: 'false',
          'data-type': 'codeBlock',
        },
        languageClassPrefix: 'language-',
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
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
        allowBase64: true,
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
        spellcheck: 'false',
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
          /^(```[\w]*\n[\s\S]*?\n```)/m, // Detect markdown code blocks
        ];
        
        const isCode = codePatterns.some(pattern => pattern.test(clipboardData));
        
        if (isCode && clipboardData.split('\n').length > 1) {
          event.preventDefault();
          
          // Remove markdown code block syntax if present
          let cleanCode = clipboardData.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
          
          const language = detectLanguage(cleanCode);
          editor?.chain().focus().insertContent({
            type: 'codeBlock',
            attrs: { language },
            content: [{
              type: 'text',
              text: cleanCode,
            }],
          }).run();
          
          return true;
        }
        
        return false;
      },
      handleDrop: (_, event, __, moved) => {
        if (!moved && event.dataTransfer?.files.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/') && onImageUpload) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
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
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        // You might want to show a toast or error message here
      }
    }
  }, [editor, onImageUpload]);

  // Add file input for image upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

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
    const url = window.prompt('Enter the URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  });

  useHotkeys('ctrl+alt+c,cmd+alt+c', (e) => {
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
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 flex gap-2">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('bold') ? 'bg-gray-100' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('italic') ? 'bg-gray-100' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor?.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('link') ? 'bg-gray-100' : ''}`}
          title="Add Link (Ctrl+K)"
        >
          🔗
        </button>
        <button
          onClick={handleImageClick}
          className="p-2 rounded hover:bg-gray-100"
          title="Add Image"
        >
          📷
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('codeBlock') ? 'bg-gray-100' : ''}`}
          title="Code Block (Ctrl+Shift+C)"
        >
          {'</>'}
        </button>
      </div>
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