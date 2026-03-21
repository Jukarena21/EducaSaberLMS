# Verificación — mejoras pestaña Lecciones

Después de desplegar, ejecuta la migración de Prisma en el entorno donde corre la app (Vercel build suele aplicar migraciones si está configurado; si no, ejecuta en tu BD):

```bash
npx prisma migrate deploy
```

---

## 1. Migración `updatedAt` en `Lesson`

**Qué se espera:** la tabla `Lesson` tiene columna `updatedAt` y el API devuelve la fecha real de última modificación.

**Cómo verificar:**

1. Tras `migrate deploy`, en la BD confirma que existe la columna `updatedAt` en `"Lesson"`.
2. Como `teacher_admin`, edita una lección (cambia el título) y guarda.
3. Opcional: llama a `GET /api/lessons` o abre la red del navegador y revisa que el objeto de esa lección tenga `updatedAt` posterior a `createdAt` tras editar.

---

## 2. Columna «Área» en la tabla (prioridad lección vs curso)

**Qué se espera:** si la lección tiene **área propia** (`competency` en la lección), se muestra aunque no esté en ningún módulo o el curso no tenga área.

**Cómo verificar:**

1. Crea o edita una lección y asigna un **área** en el formulario.
2. Asegúrate de que esa lección **no** esté en un módulo (o que el curso del módulo no tenga el mismo área).
3. En la lista, la columna **Área** debe mostrar el nombre correcto (no «Sin área»).

---

## 3. Filtros combinados (búsqueda + tipo + área + rol colegio)

**Qué se espera:** los filtros ya no se pisan entre sí; un `school_admin` sigue viendo solo lecciones de cursos de su colegio o generales, y puede combinar con filtro por área y tipo.

**Cómo verificar (teacher_admin):**

1. Busca por texto, aplica **Tipo ICFES** y **Área** concretas; la lista debe coincidir con expectativas.
2. Repite con **Personalizado**.

**Cómo verificar (school_admin, si aplica):**

1. Con un usuario de colegio, confirma que la lista no muestra cursos ajenos.
2. Aplica filtro por **Área** y comprueba que los resultados siguen siendo coherentes.

---

## 4. Tipo «Personalizado» y lecciones sin módulos

**Qué se espera:** las lecciones **sin** ningún vínculo a un curso ICFES vía módulos aparecen al filtrar **Personalizado**.

**Cómo verificar:**

1. Localiza una lección que no esté en ningún módulo de curso ICFES (o sin módulos).
2. Filtro **Personalizado** → debe poder aparecer en la lista.

---

## 5. Tipo «ICFES» y lecciones huérfanas con área

**Qué se espera:** una lección **sin módulos** pero con **área** asignada puede listarse al filtrar **ICFES** (heurística para contenido ICFES no enlazado aún).

**Cómo verificar:**

1. Crea lección ICFES con área, sin añadirla a módulos.
2. Filtro **ICFES** → debe aparecer.

---

## 6. Asignación en lote de áreas

**Qué se espera:** si alguna actualización falla, ves un toast de **asignación parcial** con conteo; si todo va bien, toast de éxito.

**Cómo verificar:**

1. Con varias lecciones **sin área**, usa **Asignar en lote** con un área elegida.
2. Comprueba el mensaje y que las filas muestran el área correcto.

---

## 7. Lista tras crear lección (`useLessons`)

**Qué se espera:** al crear una lección, la tabla se refresca desde el servidor (incluye `competency` y `updatedAt`).

**Cómo verificar:**

1. Crea una lección nueva con área.
2. Al cerrar el formulario, la nueva fila debe aparecer con el **área** correcta sin recargar la página manualmente.

---

## 8. Vista previa — video YouTube

**Qué se espera:** URLs típicas de YouTube muestran **iframe** embebido; otras URLs muestran enlace para abrir.

**Cómo verificar:**

1. Pon una URL de YouTube (`watch?v=` o `youtu.be/`) en la lección.
2. Abre **Vista previa** → pestaña **Video** → debe verse el reproductor embebido.

---

## 9. Vista previa — ejercicios / preguntas

**Qué se espera:** se muestra el número de preguntas de práctica (`lessonQuestionCount`) desde `GET /api/lessons/:id`.

**Cómo verificar:**

1. Una lección con preguntas vinculadas en el banco (como ya configuráis en el sistema).
2. Vista previa → **Ejercicios** → debe indicar el número o «no hay preguntas» si el conteo es 0.

---

## 10. Formulario de lección — textos «Área»

**Qué se espera:** etiquetas y validaciones dicen **Área** en lugar de **Competencia**.

**Cómo verificar:**

1. Abre crear/editar lección y revisa el campo obligatorio y mensajes de error.

---

Si algo falla en un paso, anota el rol de usuario, filtros aplicados y un ejemplo de ID de lección para depurar con calma.
