# 🚀 Guía de Despliegue en Vercel

## 📋 Checklist Pre-Deploy

### 1. Variables de Entorno Requeridas

Necesitas configurar las siguientes variables de entorno en Vercel:

#### 🔴 **OBLIGATORIAS (Críticas):**

```env
# Base de datos (PostgreSQL recomendado para producción)
DATABASE_URL=postgresql://user:password@host:port/database

# Autenticación NextAuth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=generar-un-secret-unico-y-seguro-aqui
```

#### ⚠️ **IMPORTANTES (Recomendadas):**

```env
# Email (para recuperación de contraseña y notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-gmail

# Almacenamiento de archivos (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

#### ✅ **OPCIONALES:**

```env
# Redis (si se implementa cache)
REDIS_URL=redis://...

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## 🗄️ Configuración de Base de Datos

### Opciones Recomendadas para Vercel:

1. **Vercel Postgres** (Recomendado - Integración perfecta)
   - Crear desde el dashboard de Vercel
   - Se conecta automáticamente
   - URL se genera automáticamente

2. **Supabase** (Gratis hasta cierto límite)
   - Crear cuenta en supabase.com
   - Crear nuevo proyecto
   - Copiar la connection string

3. **Neon** (PostgreSQL serverless)
   - Crear cuenta en neon.tech
   - Crear proyecto
   - Copiar la connection string

### Pasos para configurar la base de datos:

1. Crear la base de datos en el proveedor elegido
2. Copiar la `DATABASE_URL` (formato: `postgresql://user:password@host:port/database`)
3. Agregarla como variable de entorno en Vercel

---

## 🔐 Generar NEXTAUTH_SECRET

Para generar un `NEXTAUTH_SECRET` seguro, puedes usar:

```bash
openssl rand -base64 32
```

O usar un generador online: https://generate-secret.vercel.app/32

**⚠️ IMPORTANTE:** Este secret debe ser único y no debe compartirse públicamente.

---

## 📝 Pasos para Deploy en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Subir el código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

2. **Conectar con Vercel:**
   - Ir a https://vercel.com
   - Iniciar sesión con GitHub
   - Click en "Add New Project"
   - Seleccionar tu repositorio
   - Configurar las variables de entorno
   - Click en "Deploy"

### Opción 2: Desde CLI de Vercel

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configurar variables de entorno:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

---

## 🔧 Configuración Post-Deploy

### 1. Ejecutar Migraciones de Prisma

Después del primer deploy, necesitas ejecutar las migraciones:

**Opción A: Desde Vercel Dashboard**
- Ir a tu proyecto en Vercel
- Abrir la pestaña "Settings" > "Environment Variables"
- Agregar todas las variables necesarias

**Opción B: Desde CLI**
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

**Opción C: Script de Build (Recomendado)**

Agregar al `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 2. Configurar NEXTAUTH_URL

Después del deploy, actualizar `NEXTAUTH_URL` con la URL real:
```
NEXTAUTH_URL=https://tu-proyecto.vercel.app
```

### 3. Verificar Build

El build debe completarse sin errores. Si hay errores:
- Revisar los logs en Vercel
- Verificar que todas las variables de entorno estén configuradas
- Verificar que la base de datos esté accesible

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL is required"
- Verificar que la variable `DATABASE_URL` esté configurada en Vercel
- Verificar que la URL sea correcta y accesible

### Error: "NEXTAUTH_SECRET is required"
- Generar un nuevo secret seguro
- Agregarlo como variable de entorno en Vercel

### Error en Build: TypeScript/ESLint
- El proyecto tiene `ignoreBuildErrors: true` configurado
- Esto está bien para desarrollo, pero revisar errores antes de producción

### Error: Puppeteer no encuentra Chrome
- Vercel incluye Chrome automáticamente
- Si hay problemas, verificar la versión de Puppeteer

### Error: Prisma Client no generado
- Agregar `prisma generate` al script de build
- Verificar que `@prisma/client` esté en `dependencies`

---

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] Proyecto conectado en Vercel
- [ ] Base de datos creada y `DATABASE_URL` configurada
- [ ] `NEXTAUTH_SECRET` generado y configurado
- [ ] `NEXTAUTH_URL` configurada con la URL de producción
- [ ] Variables de entorno opcionales configuradas (SMTP, Cloudinary, etc.)
- [ ] Migraciones de Prisma ejecutadas
- [ ] Build completado exitosamente
- [ ] Aplicación accesible en la URL de Vercel
- [ ] Probar login y funcionalidades principales

---

## 📞 Soporte

Si encuentras problemas durante el deploy, revisa:
- Logs de build en Vercel Dashboard
- Logs de runtime en Vercel Dashboard
- Variables de entorno configuradas correctamente
- Conectividad con la base de datos




