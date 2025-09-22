# 🚀 Setup Local - EducaSaber LMS

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior)
- **Git** (ya instalado)
- **Editor de código** (VS Code recomendado)

## 🔧 Configuración Inicial

### 1. **Ejecutar Script de Configuración**
```bash
node setup-local.js
```

Este script automáticamente:
- ✅ Crea el archivo `.env.local`
- ✅ Configura el esquema SQLite
- ✅ Prepara la estructura de directorios

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Base de Datos**
```bash
# Generar cliente de Prisma
npx prisma generate

# Crear base de datos SQLite
npx prisma db push

# (Opcional) Ver la base de datos
npx prisma studio
```

### 4. **Iniciar Servidor de Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## 📁 Estructura de Archivos

```
EducaSaberLMS/
├── prisma/
│   ├── schema.prisma          # Esquema SQLite
│   ├── schema-sqlite.prisma   # Esquema original SQLite
│   └── dev.db                 # Base de datos SQLite (se crea automáticamente)
├── app/                       # Páginas Next.js
├── components/                # Componentes React
├── lib/                       # Utilidades y configuraciones
├── .env.local                 # Variables de entorno locales
├── setup-local.js             # Script de configuración
└── package.json               # Dependencias del proyecto
```

## 🔍 Verificación de la Instalación

### **1. Verificar Base de Datos**
```bash
npx prisma studio
```
Deberías ver todas las tablas creadas correctamente.

### **2. Verificar Servidor**
- Abre `http://localhost:3000`
- Deberías ver la landing page del LMS

### **3. Verificar Archivos Creados**
```bash
ls -la prisma/
# Deberías ver: dev.db, schema.prisma

ls -la .env.local
# Debería existir el archivo
```

## 🛠️ Comandos Útiles

### **Desarrollo**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
```

### **Base de Datos**
```bash
npx prisma studio    # Interfaz visual de la BD
npx prisma db push   # Sincronizar esquema
npx prisma generate  # Regenerar cliente
npx prisma migrate dev --name init  # Crear migración
```

### **Troubleshooting**
```bash
# Si hay problemas con npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Si hay problemas con Prisma
npx prisma generate --force
rm -rf prisma/dev.db
npx prisma db push
```

## 📊 Base de Datos Local

### **SQLite vs PostgreSQL**
- **Desarrollo local**: SQLite (más simple, no requiere servidor)
- **Producción**: PostgreSQL (más robusto, mejor para reportes)

### **Migración a PostgreSQL**
Cuando estés listo para producción:
1. Cambia `provider = "sqlite"` por `provider = "postgresql"`
2. Actualiza `DATABASE_URL` en `.env.local`
3. Ejecuta `npx prisma db push`

## 🎯 Próximos Pasos

1. **Implementar autenticación** con NextAuth.js
2. **Crear API routes** para CRUD de usuarios
3. **Conectar frontend** con la base de datos
4. **Implementar sistema de roles** y permisos

## ❓ Problemas Comunes

### **Error: "npm no se reconoce"**
- Reinicia la terminal después de instalar Node.js
- Verifica que Node.js esté en el PATH

### **Error: "Prisma Client not found"**
```bash
npx prisma generate
```

### **Error: "Database not found"**
```bash
npx prisma db push
```

### **Error: "Port 3000 already in use"**
```bash
# Cambia el puerto en package.json o mata el proceso
npx kill-port 3000
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de error
2. Verifica que todos los archivos estén creados
3. Ejecuta los comandos de troubleshooting
4. Consulta la documentación de Prisma y Next.js

---

**¡Listo para desarrollar! 🎉** 