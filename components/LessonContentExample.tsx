'use client';

import { LessonContentViewer } from './LessonContentViewer';

export function LessonContentExample() {
  // Ejemplo de contenido HTML que se generaría con el editor
  const exampleContent = `
    <h1>Operaciones con Polinomios</h1>
    
    <h2>¿Qué es un polinomio?</h2>
    <p>Un <strong>polinomio</strong> es una expresión algebraica formada por la suma de varios términos, donde cada término es el producto de un coeficiente numérico y una o más variables elevadas a potencias enteras no negativas.</p>
    
    <p><em>Ejemplo:</em> <code>3x² + 2x - 5</code></p>
    
    <hr>
    
    <h2>Suma de polinomios</h2>
    <p>Para sumar polinomios, se suman los coeficientes de los términos semejantes.</p>
    
    <p><strong>Ejemplo:</strong></p>
    <blockquote>
      <p>(3x² + 2x - 1) + (x² - 4x + 3) = 4x² - 2x + 2</p>
    </blockquote>
    
    <h3>Pasos para sumar:</h3>
    <ol>
      <li>Identificar términos semejantes</li>
      <li>Sumar los coeficientes</li>
      <li>Mantener la variable y el exponente</li>
    </ol>
    
    <hr>
    
    <h2>Resta de polinomios</h2>
    <p>Para restar polinomios, se cambia el signo de todos los términos del sustraendo y luego se suman.</p>
    
    <p><strong>Ejemplo:</strong></p>
    <blockquote>
      <p>(3x² + 2x - 1) - (x² - 4x + 3) = 3x² + 2x - 1 - x² + 4x - 3 = 2x² + 6x - 4</p>
    </blockquote>
    
    <h3>Propiedades importantes:</h3>
    <ul>
      <li>La resta no es conmutativa</li>
      <li>Se puede convertir en suma cambiando signos</li>
      <li>El resultado es otro polinomio</li>
    </ul>
    
    <hr>
    
    <h2>Multiplicación de polinomios</h2>
    <p>Para multiplicar polinomios, se aplica la propiedad distributiva y se multiplican todos los términos del primer polinomio por todos los términos del segundo.</p>
    
    <p><strong>Ejemplo:</strong></p>
    <blockquote>
      <p>(2x + 3)(x - 1) = 2x² - 2x + 3x - 3 = 2x² + x - 3</p>
    </blockquote>
    
    <h3>Método FOIL:</h3>
    <ul>
      <li><strong>F</strong>irst: Primeros términos</li>
      <li><strong>O</strong>uter: Términos externos</li>
      <li><strong>I</strong>nner: Términos internos</li>
      <li><strong>L</strong>ast: Últimos términos</li>
    </ul>
  `;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ejemplo de Contenido de Lección</h1>
      <p className="text-muted-foreground mb-6">
        Este es un ejemplo de cómo se vería el contenido de una lección usando el editor de texto enriquecido.
      </p>
      
      <div className="border rounded-lg p-6 bg-white">
        <LessonContentViewer content={exampleContent} />
      </div>
      
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Características del Editor:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li><strong>Títulos:</strong> H1, H2, H3 para estructura jerárquica</li>
          <li><strong>Formato:</strong> Negritas, cursivas, código inline</li>
          <li><strong>Listas:</strong> Numeradas y con viñetas</li>
          <li><strong>Bloques:</strong> Citas y bloques de código</li>
          <li><strong>Separadores:</strong> Líneas horizontales para dividir secciones</li>
          <li><strong>Historial:</strong> Deshacer y rehacer cambios</li>
        </ul>
      </div>
    </div>
  );
}
