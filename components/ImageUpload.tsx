'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Eye,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Subir imagen",
  maxSize = 2, // Reducido de 5MB a 2MB para ahorrar costos
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de archivo no válido',
        description: `Solo se permiten archivos: ${acceptedTypes.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Validar tamaño según tipo de archivo
    let maxSizeForType = maxSize;
    if (file.type === 'image/gif') {
      maxSizeForType = 1; // GIFs limitados a 1MB para ahorrar costos
    } else if (file.type === 'image/png') {
      maxSizeForType = 1.5; // PNGs limitados a 1.5MB
    }

    if (file.size > maxSizeForType * 1024 * 1024) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El archivo debe ser menor a ${maxSizeForType}MB (${file.type === 'image/gif' ? 'GIFs limitados a 1MB para optimizar costos' : file.type === 'image/png' ? 'PNGs limitados a 1.5MB' : `${maxSize}MB`})`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    // Leer el archivo como Data URL y usar ese valor como URL persistente
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        toast({
          title: 'Error al procesar imagen',
          description: 'No se pudo leer el archivo de imagen. Inténtalo de nuevo.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      setPreview(dataUrl);
      onChange(dataUrl);

      toast({
        title: 'Imagen preparada',
        description: 'La imagen se ha cargado correctamente.',
      });
      setIsUploading(false);
    };

    reader.onerror = () => {
      toast({
        title: 'Error al subir imagen',
        description: 'Hubo un problema al leer la imagen. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">Imagen</Label>
      
      {preview ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(preview, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver imagen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Formatos soportados:</p>
              <p>• JPEG/WebP: hasta {maxSize}MB</p>
              <p>• PNG: hasta 1.5MB</p>
              <p>• GIF: hasta 1MB</p>
              <p className="text-green-600 font-medium">💡 WebP es más económico</p>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            o
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-sm">
              Ingresar URL de imagen:
            </Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              onChange={(e) => handleUrlChange(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="w-3 h-3" />
        <span>
          Las imágenes se optimizarán automáticamente para mejor rendimiento.
        </span>
      </div>
    </div>
  );
}
