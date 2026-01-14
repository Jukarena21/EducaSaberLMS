# ✅ Checklist para Deploy en Vercel

## 🔴 OBLIGATORIO - Lo que necesitas hacer:

### 1. **Base de Datos PostgreSQL**
   - ✅ Crear una base de datos PostgreSQL (Vercel Postgres, Supabase, Neon, etc.)
   - ✅ Obtener la `DATABASE_URL` (formato: `postgresql://user:password@host:port/database`)
   - ✅ **Acción requerida:** Crear la base de datos y copiar la URL

### 2. **Generar NEXTAUTH_SECRET**
   - ✅ Generar un secret único y seguro
   - ✅ Puedes usar: `openssl rand -base64 32`
   - ✅ O usar: https://generate-secret.vercel.app/32
   - ✅ **Acción requerida:** Generar el secret

### 3. **Subir código a GitHub** (si aún no está)
   - ✅ Inicializar repositorio Git
   - ✅ Subir a GitHub
   - ✅ **Acción requerida:** Hacer commit y push del código

### 4. **Variables de Entorno en Vercel**
   Necesitas configurar estas variables en el dashboard de Vercel:

   **OBLIGATORIAS:**
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXTAUTH_SECRET=tu-secret-generado-aqui
   NEXTAUTH_URL=https://tu-proyecto.vercel.app
   ```

   **OPCIONALES (pero recomendadas):**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
   CLOUDINARY_API_KEY=tu-api-key
   CLOUDINARY_API_SECRET=tu-api-secret
   ```

---

## 📋 Pasos para Deploy:

### Paso 1: Preparar Base de Datos
1. Elegir proveedor (Vercel Postgres, Supabase, Neon)
2. Crear base de datos
3. Copiar la `DATABASE_URL`

### Paso 2: Conectar con Vercel
1. Ir a https://vercel.com
2. Iniciar sesión (puedes usar GitHub)
3. Click en "Add New Project"
4. Conectar tu repositorio de GitHub
5. O usar CLI: `vercel login` y luego `vercel`

### Paso 3: Configurar Variables de Entorno
1. En el dashboard de Vercel, ir a Settings > Environment Variables
2. Agregar todas las variables necesarias
3. Asegurarse de seleccionar los ambientes correctos (Production, Preview, Development)

### Paso 4: Deploy
1. Vercel detectará automáticamente que es un proyecto Next.js
2. El build se ejecutará automáticamente
3. Las migraciones de Prisma se ejecutarán durante el build (gracias al script actualizado)

### Paso 5: Verificar
1. Una vez deployado, actualizar `NEXTAUTH_URL` con la URL real de Vercel
2. Probar el login
3. Verificar que la base de datos esté conectada

---

## ⚠️ Notas Importantes:

1. **Base de Datos:** El proyecto actualmente usa SQLite en desarrollo. Para producción necesitas PostgreSQL.

2. **Migraciones:** Las migraciones de Prisma se ejecutarán automáticamente durante el build gracias al script actualizado en `package.json`.

3. **Puppeteer:** Vercel incluye Chrome automáticamente, así que no necesitas instalar nada adicional.

4. **Cron Jobs:** Ya está configurado en `vercel.json` para limpiar notificaciones diariamente.

---

## 🆘 Si algo falla:

1. Revisar los logs de build en Vercel Dashboard
2. Verificar que todas las variables de entorno estén configuradas
3. Verificar que la base de datos sea accesible desde internet
4. Revisar la guía completa en `GUIA_DEPLOY_VERCEL.md`




