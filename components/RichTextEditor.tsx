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
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
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
  AlignJustify,
  Link,
  Table,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
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
  const [textColorPopoverOpen, setTextColorPopoverOpen] = useState(false);

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
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
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

  const getCurrentTextColor = () => {
    try {
      const attrs = editor.getAttributes('textStyle');
      return attrs.color || '#000000';
    } catch {
      return '#000000';
    }
  };

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Subrayado (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Button
            type="button"
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

        {/* Text Color */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Popover open={textColorPopoverOpen} onOpenChange={setTextColorPopoverOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                type="button"
                title="Color de texto"
              >
                <span
                  className="inline-block h-3 w-3 rounded border"
                  style={{ backgroundColor: getCurrentTextColor() }}
                />
                <span className="ml-2">Color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48 p-2 z-[9999]"
              align="start"
              side="bottom"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                setTimeout(() => editor?.commands.focus(), 50);
              }}
            >
              <div className="space-y-2">
                <Label className="text-xs">Color de texto</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={getCurrentTextColor()}
                    onChange={(e) => {
                      const value = e.target.value;
                      editor.chain().focus().setColor(value).run();
                    }}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={getCurrentTextColor()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Aceptar hex básico (sin validar demasiado)
                      editor.chain().focus().setColor(value).run();
                    }}
                    className="h-8 text-xs"
                    placeholder="#000000"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {['#000000', '#1f2937', '#dc2626', '#2563eb', '#16a34a', '#a855f7', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-6 w-6 rounded border"
                      style={{ backgroundColor: c }}
                      onClick={() => editor.chain().focus().setColor(c).run()}
                      title={c}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    title="Quitar color"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>


        {/* Subscript / Superscript */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            type="button"
            variant={editor.isActive('subscript') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            title="Subíndice"
          >
            <span className="text-xs font-semibold leading-none">x₂</span>
          </Button>
          <Button
            type="button"
            variant={editor.isActive('superscript') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            title="Superíndice"
          >
            <span className="text-xs font-semibold leading-none">x²</span>
          </Button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Centrar"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Alinear a la derecha"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justificar"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista con viñetas"
          >
            <List className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('taskList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Lista de tareas (Checklist)"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            }}
            title="Insertar tabla"
          >
            <Table className="w-4 h-4" />
          </Button>
          
          {editor.isActive('table') && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="Agregar columna antes"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Agregar columna después"
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Eliminar columna"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title="Agregar fila antes"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Agregar fila después"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Eliminar fila"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Eliminar tabla"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        {/* Block elements */}
        <div className="flex items-center gap-1 border-r pr-2 mr-1">
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Cita"
          >
            <Quote className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Código"
          >
            <Code className="w-4 h-4" />
          </Button>

          <Button
            type="button"
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
            type="button"
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
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
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
          className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:border [&_.ProseMirror_table]:border-gray-300 [&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-gray-300 [&_.ProseMirror_table_td]:p-2 [&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-gray-300 [&_.ProseMirror_table_th]:p-2 [&_.ProseMirror_table_th]:bg-gray-100 [&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-0 [&_.ProseMirror_li[data-type='taskItem']]:flex [&_.ProseMirror_li[data-type='taskItem']]:items-start [&_.ProseMirror_li[data-type='taskItem']]:gap-2 [&_.ProseMirror_li[data-type='taskItem']_input[type='checkbox']]:mt-1 [&_.ProseMirror_li[data-type='taskItem']_input[type='checkbox']]:cursor-pointer"
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
