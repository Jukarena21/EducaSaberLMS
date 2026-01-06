"use client"
import { useSchoolBranding } from '@/hooks/useSchoolBranding'

export function BrandingTest() {
  const { branding, loading, error } = useSchoolBranding()

  if (loading) return <div>Cargando branding...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧪 Prueba de Branding</h3>
      
      <div className="space-y-2 mb-4">
        <div><strong>Logo:</strong> {branding?.logoUrl || 'No definido'}</div>
        <div><strong>Color Primario:</strong> {branding?.themePrimary || 'No definido'}</div>
        <div><strong>Color Secundario:</strong> {branding?.themeSecondary || 'No definido'}</div>
        <div><strong>Color Accent:</strong> {branding?.themeAccent || 'No definido'}</div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-gray-600">Vista previa de colores:</div>
        <div 
          className="p-2 rounded text-white"
          style={{ backgroundColor: branding?.themePrimary || '#3B82F6' }}
        >
          Color Primario
        </div>
        <div 
          className="p-2 rounded text-white"
          style={{ backgroundColor: branding?.themeSecondary || '#6B7280' }}
        >
          Color Secundario
        </div>
        <div 
          className="p-2 rounded text-white"
          style={{ backgroundColor: branding?.themeAccent || '#EF4444' }}
        >
          Color Accent
        </div>
      </div>

      {branding?.logoUrl && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">Logo:</div>
          <img 
            src={branding.logoUrl} 
            alt="Logo" 
            className="w-16 h-16 object-contain border rounded"
          />
        </div>
      )}
    </div>
  )
}
