# Estructura de Competencia y Área

## 📊 Estructura en Base de Datos

### Tabla: `Competency` (Áreas ICFES)
```
Competency
├── id (PK)
├── name (único) - ej: 'lectura_critica', 'matematicas'
├── displayName - ej: 'Lectura Crítica', 'Matemáticas'
├── description
├── colorHex
└── iconName
```

**Contiene las 5 áreas ICFES:**
- Matemáticas (Razonamiento Cuantitativo)
- Ciencias Naturales (Comunicación Escrita)
- Ciencias Sociales (Competencias Ciudadanas)
- Inglés
- Lectura Crítica

### Tabla: `ExamQuestion` (Preguntas)
```
ExamQuestion
├── id (PK)
├── examId (FK → Exam)
├── questionText
├── optionA, optionB, optionC, optionD
├── correctOption
├── explanation
│
├── tema (String?) - Tema de la pregunta
├── subtema (String?) - Subtema de la pregunta
├── componente (String?) - Componente ICFES
│
├── competencia (String?) ⭐ TEXTO LIBRE - Guardado aquí directamente
│   └── Ejemplo: "Análisis de gráficos", "Comprensión lectora", etc.
│
└── competencyId (FK → Competency) ⭐ RELACIÓN CON ÁREA
    └── Apunta a una de las 5 áreas ICFES
```

## 🔗 Relaciones

```
ExamQuestion
    │
    ├── competencyId ──────┐
    │                      │
    │                      ▼
    │                 Competency (Area)
    │                      │
    │                      ├── id
    │                      ├── name: 'matematicas'
    │                      └── displayName: 'Matemáticas'
    │
    └── competencia: "Análisis de funciones" (texto libre)
```

## 📝 Ejemplo Real

**Pregunta de Matemáticas:**

```json
{
  "id": "q123",
  "examId": "exam456",
  "questionText": "¿Cuál es la derivada de x²?",
  "optionA": "x",
  "optionB": "2x",
  "optionC": "x²",
  "optionD": "2x²",
  "correctOption": "B",
  
  "tema": "Cálculo diferencial",
  "subtema": "Derivadas",
  "componente": "Razonamiento Cuantitativo - Análisis",
  
  "competencia": "Análisis de funciones y cálculo de derivadas", ⭐ TEXTO LIBRE
  "competencyId": "comp-razonamiento-cuantitativo", ⭐ FK A Competency
  "competency": { ⭐ OBJETO RELACIONADO
    "id": "comp-razonamiento-cuantitativo",
    "name": "razonamiento_cuantitativo",
    "displayName": "Matemáticas"
  }
}
```

## 🎯 Diferencia Clave

| Campo | Tipo | Dónde se guarda | Propósito |
|-------|------|----------------|-----------|
| **competencia** | String (texto libre) | Columna en `ExamQuestion` | Competencia específica ingresada por el usuario para análisis |
| **competencyId** | FK (String) | Columna en `ExamQuestion` | Relación con una de las 5 áreas ICFES |
| **competency** | Objeto relacionado | Tabla `Competency` | Datos completos del área ICFES |

## 💾 Dónde se Guarda

1. **`competencia` (texto libre)**: 
   - Se guarda **directamente en la columna `competencia`** de la tabla `ExamQuestion`
   - Tipo: `TEXT` (nullable)
   - Ejemplo SQL: `INSERT INTO "ExamQuestion" (..., competencia) VALUES (..., 'Análisis de funciones')`

2. **`competencyId` (área ICFES)**:
   - Se guarda **directamente en la columna `competencyId`** de la tabla `ExamQuestion`
   - Tipo: `TEXT` (nullable, FK)
   - Ejemplo SQL: `INSERT INTO "ExamQuestion" (..., competencyId) VALUES (..., 'comp-razonamiento-cuantitativo')`

## 🔍 Consultas

### Obtener pregunta con su área y competencia:
```sql
SELECT 
  eq.id,
  eq.questionText,
  eq.competencia,  -- Texto libre
  eq.competencyId, -- FK
  c.displayName as area_display_name
FROM "ExamQuestion" eq
LEFT JOIN "Competency" c ON eq."competencyId" = c.id
WHERE eq.id = 'q123';
```

### Filtrar por competencia (texto libre):
```sql
SELECT * FROM "ExamQuestion" 
WHERE competencia ILIKE '%análisis%';
```

### Filtrar por área ICFES:
```sql
SELECT * FROM "ExamQuestion" 
WHERE competencyId = 'comp-razonamiento-cuantitativo';
```

## ✅ Resumen

- **`competencia`**: Campo de texto libre guardado **directamente en `ExamQuestion`**
- **`competencyId`**: Foreign Key que relaciona con la tabla `Competency` (áreas ICFES)
- **No hay tabla separada para competencias**: Se guardan como texto en cada pregunta
- **Ventaja**: Permite análisis y reportes flexibles por competencia específica
