# 🔧 Dependencias de Infraestructura - EducaSaber LMS

Este documento lista todas las funcionalidades que dependen de la plataforma de despliegue o servicios externos.

## 📋 Resumen de Dependencias

### ✅ **Funcionalidades que NO dependen de la plataforma:**
- Base de datos (Prisma es agnóstico - funciona con PostgreSQL, MySQL, SQLite, etc.)
- Autenticación básica (NextAuth funciona en cualquier plataforma)
- Variables de entorno (todas las plataformas las soportan)
- Lógica de negocio y componentes React

### ⚠️ **Funcionalidades que SÍ dependen de la plataforma:**

---

## 1. 🕐 **Cron Jobs / Tareas Programadas**

### **Dependencia:**
- **Limpieza automática de notificaciones expiradas** (cada noche a las 2:00 AM)

### **Implementación actual:**
- ✅ Configurado para **Vercel** (`vercel.json`)
- ⚠️ En otras plataformas requiere configuración manual

### **Opciones por plataforma:**

#### **Vercel** (Recomendado)
```json
// vercel.json ya configurado
{
  "crons": [{
    "path": "/api/cron/cleanup-notifications",
    "schedule": "0 2 * * *"
  }]
}
```
- ✅ Funciona automáticamente
- ✅ Sin configuración adicional

#### **Otras plataformas (Railway, Render, AWS, etc.)**
- Necesitas configurar un cron job externo que llame:
  ```
  POST https://tu-dominio.com/api/cron/cleanup-notifications
  Authorization: Bearer CRON_SECRET
  ```
- Opciones:
  - **GitHub Actions** (gratis, fácil)
  - **Cron-job.org** (gratis)
  - **EasyCron** (pago)
  - **Cron del servidor** (si tienes acceso SSH)

### **Variable de entorno requerida:**
```env
CRON_SECRET=tu-secret-token-super-seguro
```

---

## 2. 📧 **Envío de Emails (SMTP)**

### **Dependencia:**
- **Formulario de contacto** (`/api/contact/route.ts`)
- Actualmente configurado pero **opcional** (si no hay SMTP, solo registra en logs)

### **Variables de entorno:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
CONTACT_EMAIL=email-destino@ejemplo.com
```

### **Opciones por plataforma:**
- ✅ **Cualquier plataforma**: Funciona igual, solo necesitas credenciales SMTP
- **Proveedores recomendados:**
  - Gmail (gratis, hasta 500 emails/día)
  - SendGrid (gratis hasta 100 emails/día)
  - AWS SES (muy barato)
  - Resend (gratis hasta 3,000 emails/mes)

### **Estado actual:**
- ⚠️ Si no hay SMTP configurado, el formulario funciona pero no envía emails (solo logs)

---

## 3. 📁 **Almacenamiento de Archivos (Logos, Imágenes)**

### **Dependencia:**
- **Logos de colegios** (branding)
- **Imágenes de preguntas/lecciones** (si se usan)
- **Certificados PDF** (generados dinámicamente, no se almacenan)

### **Implementación actual:**
- ✅ **URLs externas**: Los logos se almacenan como URLs (pueden ser de cualquier servicio)
- ⚠️ **Componente ImageUpload**: Actualmente usa URLs temporales (no sube archivos reales)

### **Opciones por plataforma:**

#### **Vercel**
- ✅ **Vercel Blob Storage** (recomendado, fácil integración)
- ✅ **Cloudinary** (ya mencionado en `env.example`)
- ✅ **AWS S3** (más complejo pero escalable)

#### **Otras plataformas**
- ✅ **Cloudinary** (funciona en todas, gratis hasta 25GB)
- ✅ **AWS S3** (funciona en todas)
- ✅ **Supabase Storage** (si usas Supabase)
- ✅ **Google Cloud Storage**
- ✅ **Azure Blob Storage**

### **Variables de entorno (si usas Cloudinary):**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### **Estado actual:**
- ⚠️ **ImageUpload** necesita implementación real de subida de archivos
- ✅ Los logos se pueden subir como URLs externas (funciona ahora)

---

## 4. 🗄️ **Base de Datos**

### **Dependencia:**
- **Prisma** es agnóstico, pero la conexión varía según el proveedor

### **Opciones por plataforma:**

#### **Vercel**
- ✅ **Vercel Postgres** (recomendado, integración perfecta)
- ✅ **Supabase** (muy popular, gratis hasta cierto límite)
- ✅ **Neon** (PostgreSQL serverless)
- ✅ **PlanetScale** (MySQL serverless)

#### **Otras plataformas**
- ✅ **Cualquier PostgreSQL/MySQL** (Railway, Render, AWS RDS, etc.)
- ✅ **SQLite** (solo para desarrollo local)

### **Variable de entorno:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### **Estado actual:**
- ✅ Funciona con cualquier base de datos compatible con Prisma

---

## 5. 🔐 **Autenticación (NextAuth)**

### **Dependencia:**
- **NextAuth** necesita la URL base de la aplicación

### **Variables de entorno:**
```env
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-key-super-seguro
```

### **Opciones por plataforma:**
- ✅ **Todas las plataformas**: Funciona igual, solo cambia la URL
- ⚠️ **Importante**: `NEXTAUTH_URL` debe ser la URL pública de tu aplicación

### **Estado actual:**
- ✅ Funciona en cualquier plataforma

---

## 6. 📊 **Analytics (Opcional)**

### **Dependencia:**
- **Google Analytics** (mencionado en `env.example`, pero no implementado)

### **Variable de entorno:**
```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### **Estado actual:**
- ⚠️ No implementado aún, solo mencionado en ejemplo

---

## 7. 🔄 **Cache (Opcional - No implementado)**

### **Dependencia:**
- **Redis** (mencionado en `env.example`, pero no implementado)

### **Variable de entorno:**
```env
REDIS_URL=redis://localhost:6379
```

### **Estado actual:**
- ⚠️ No implementado aún, solo mencionado en ejemplo

---

## 📝 **Resumen de Variables de Entorno Requeridas**

### **Obligatorias:**
```env
# Base de datos
DATABASE_URL=postgresql://...

# Autenticación
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-key

# Cron jobs (si quieres limpieza automática)
CRON_SECRET=tu-secret-token
```

### **Opcionales pero recomendadas:**
```env
# Email (para formulario de contacto)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
CONTACT_EMAIL=email-destino@ejemplo.com

# Almacenamiento de archivos (si implementas subida real)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🎯 **Recomendaciones por Plataforma**

### **Vercel** (Más fácil)
- ✅ Cron jobs automáticos
- ✅ Variables de entorno fáciles
- ✅ Integración perfecta con Next.js
- ✅ Vercel Postgres disponible
- ✅ Vercel Blob Storage para archivos

### **Railway / Render** (Alternativas buenas)
- ✅ Fácil configuración
- ✅ PostgreSQL incluido
- ⚠️ Cron jobs requieren configuración externa
- ✅ Variables de entorno fáciles

### **AWS / Azure / GCP** (Más complejo)
- ✅ Máxima flexibilidad
- ✅ Escalabilidad
- ⚠️ Requiere más configuración
- ⚠️ Cron jobs requieren CloudWatch/Cloud Scheduler/etc.

---

## ✅ **Checklist de Configuración por Plataforma**

### **Vercel:**
- [ ] Configurar `DATABASE_URL`
- [ ] Configurar `NEXTAUTH_URL` y `NEXTAUTH_SECRET`
- [ ] Configurar `CRON_SECRET` (para limpieza automática)
- [ ] (Opcional) Configurar SMTP para emails
- [ ] (Opcional) Configurar Cloudinary/Vercel Blob para archivos

### **Otras plataformas:**
- [ ] Configurar `DATABASE_URL`
- [ ] Configurar `NEXTAUTH_URL` y `NEXTAUTH_SECRET`
- [ ] Configurar `CRON_SECRET`
- [ ] **Configurar cron job externo** para limpieza automática
- [ ] (Opcional) Configurar SMTP para emails
- [ ] (Opcional) Configurar Cloudinary/S3 para archivos

---

## 🔧 **Tareas Pendientes de Implementación**

1. ⚠️ **Subida real de archivos** (`ImageUpload` component)
2. ⚠️ **Integración con servicio de almacenamiento** (Cloudinary/S3)
3. ⚠️ **Mejora del sistema de emails** (templates, notificaciones automáticas)
4. ⚠️ **Implementación de Redis** (si se necesita cache)

---

## 📚 **Recursos Útiles**

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Cloudinary Integration](https://cloudinary.com/documentation/next_integration)

