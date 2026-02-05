'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState, useRef } from 'react';
import * as React from 'react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import { Extension, Mark } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline,
  Strikethrough,
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  SeparatorHorizontal,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';

// Extensión personalizada para fontSize usando Mark
const FontSize = Mark.create({
  name: 'fontSize',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          const fontSize = element.style.fontSize;
          return fontSize ? { fontSize } : false;
        },
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
  
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .focus()
          .setMark(this.name, { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .focus()
          .unsetMark(this.name)
          .run();
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Escribe el contenido de la lección...",
  className = ""
}: RichTextEditorProps) {
  const { toast } = useToast();
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [fontSizePopoverOpen, setFontSizePopoverOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Deshabilitar link y underline porque los agregamos por separado
        link: false,
        underline: false,
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextStyle,
      Color,
      FontSize, // Extensión personalizada para fontSize
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  // Sincronizar el contenido cuando cambie el prop (evitar loops)
  const contentRef = useRef(content);
  useEffect(() => {
    if (!editor) return;
    
    // Solo actualizar si el contenido cambió desde fuera (no del editor mismo)
    if (contentRef.current !== content) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content, false);
      }
      contentRef.current = content;
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ 
        src: imageUrl,
        alt: imageAlt || 'Imagen'
      }).run();
      setImageUrl('');
      setImageAlt('');
      setShowImageDialog(false);
    }
  };

  const addLink = () => {
    const url = window.prompt('Ingresa la URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const fontSizeOptions = [
    { value: '12px', label: '12px' },
    { value: '14px', label: '14px' },
    { value: '16px', label: '16px' },
    { value: '18px', label: '18px' },
    { value: '20px', label: '20px' },
    { value: '24px', label: '24px' },
    { value: '28px', label: '28px' },
    { value: '32px', label: '32px' },
    { value: '36px', label: '36px' },
    { value: '48px', label: '48px' },
  ];

  const setFontSize = (size: string) => {
    if (!editor) return;
    
    // Aplicar el tamaño de fuente directamente
    // El comando setFontSize ya maneja el foco internamente
    editor.chain().focus().setFontSize(size).run();
  };

  // Obtener el tamaño de fuente actual del texto seleccionado
  const getCurrentFontSize = () => {
    try {
      const attrs = editor.getAttributes('fontSize');
      return attrs.fontSize || '16px';
    } catch {
      return '16px';
    }
  };

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Subrayado (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Button
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Type className="w-4 h-4 text-muted-foreground" />
          <Popover open={fontSizePopoverOpen} onOpenChange={setFontSizePopoverOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-20 h-8 text-xs justify-start"
                type="button"
              >
                {getCurrentFontSize()}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-32 p-1 z-[9999]" 
              align="start" 
              side="bottom"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                // Restaurar foco al editor cuando se cierra el popover
                setTimeout(() => {
                  if (editor) {
                    editor.commands.focus();
                  }
                }, 100);
              }}
              onEscapeKeyDown={() => {
                setFontSizePopoverOpen(false);
                setTimeout(() => {
                  if (editor) {
                    editor.commands.focus();
                  }
                }, 100);
              }}
            >
              <div className="flex flex-col gap-1">
                {fontSizeOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={getCurrentFontSize() === option.value ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (!editor) return;
                      
                      // Aplicar el tamaño de fuente usando el mark fontSize
                      try {
                        // Verificar que el mark fontSize esté disponible
                        const fontSizeMark = editor.state.schema.marks.fontSize;
                        if (!fontSizeMark) {
                          console.error('fontSize mark not found in schema');
                          return;
                        }
                        
                        // Usar el comando personalizado setFontSize
                        const result = editor.chain().focus().setFontSize(option.value).run();
                        
                        if (!result) {
                          // Si falla, intentar directamente con setMark
                          editor.chain()
                            .focus()
                            .setMark('fontSize', { fontSize: option.value })
                            .run();
                        }
                      } catch (error) {
                        console.error('Error applying font size:', error);
                      }
                      
                      // Cerrar el popover
                      setFontSizePopoverOpen(false);
                      
                      // Restaurar foco después de un pequeño delay
                      setTimeout(() => {
                        if (editor) {
                          editor.commands.focus();
                        }
                      }, 100);
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Título 1"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Título 2"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Título 3"
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista con viñetas"
          >
            <List className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Block elements */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Cita"
          >
            <Quote className="w-4 h-4" />
          </Button>
          
          <Button
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Código"
          >
            <Code className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Línea horizontal"
          >
            <SeparatorHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageDialog(true)}
            title="Insertar imagen"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <Button
            variant={editor.isActive('link') ? 'default' : 'ghost'}
            size="sm"
            onClick={addLink}
            title="Insertar enlace"
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>

        {/* History */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Rehacer (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor content */}
      <div className="p-4 min-h-[300px]">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
        />
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insertar Imagen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL de la imagen</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>O sube una imagen</Label>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                placeholder="Subir imagen"
              />
            </div>
            <div className="space-y-2">
              <Label>Texto alternativo (opcional)</Label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descripción de la imagen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={addImage} disabled={!imageUrl}>
              Insertar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
