# 💰 Análisis Detallado de Costos - Vercel

Estimación precisa de costos mensuales usando Vercel como plataforma principal.

## 📊 Planes de Vercel (2024)

### **Hobby Plan (Gratis)**
- ✅ **Bandwidth**: 100GB/mes
- ✅ **Requests**: 100,000/mes
- ✅ **Builds**: Ilimitados
- ✅ **Funciones Serverless**: 100GB-horas/mes
- ✅ **Cron Jobs**: ✅ Incluidos
- ✅ **Analytics**: Básico
- ❌ **Soporte**: Comunidad
- ❌ **Team features**: No

### **Pro Plan ($20/mes por usuario)**
- ✅ **Bandwidth**: 1,000GB/mes (1TB)
- ✅ **Requests**: 1,000,000/mes
- ✅ **Builds**: Ilimitados
- ✅ **Funciones Serverless**: 1,000GB-horas/mes
- ✅ **Cron Jobs**: ✅ Incluidos
- ✅ **Analytics**: Avanzado
- ✅ **Soporte**: Email prioritario
- ✅ **Team features**: Sí
- ✅ **Preview deployments**: Ilimitados

### **Costos Adicionales (si excedes límites):**
- **Bandwidth adicional**: $0.15 por GB
- **Funciones adicionales**: $0.18 por GB-hora
- **Requests adicionales**: $0.60 por cada 1,000,000 requests

### **Enterprise Plan (Custom)**
- ✅ Todo de Pro +
- ✅ SLA garantizado
- ✅ Soporte 24/7
- ✅ Custom domains ilimitados
- ✅ Security features avanzados
- 💰 Precio: Contactar ventas

---

## 📈 Estimación de Uso por Escenario

### **Escenario 1: Inicio (100-500 estudiantes)**

#### **Suposiciones:**
- 100-500 estudiantes activos
- 5-10 colegios
- ~1,000 exámenes/mes
- ~50 sesiones/día promedio
- ~200 sesiones/día pico
- Tamaño promedio de página: ~500KB (con assets)
- Tamaño promedio de API response: ~50KB

#### **Cálculo de Bandwidth:**

**Páginas estáticas y assets:**
- Sesiones/día: 50 promedio, 200 pico
- Páginas por sesión: ~10 páginas
- Tamaño por página: ~500KB
- **Diario**: 50 × 10 × 500KB = 250MB/día promedio
- **Mensual**: 250MB × 30 = **7.5GB/mes** (promedio)
- **Pico**: 200 × 10 × 500KB = 1GB/día = **30GB/mes** (pico)

**API calls:**
- Requests/día: ~500 (exámenes, progreso, notificaciones)
- Tamaño promedio: ~50KB
- **Mensual**: 500 × 50KB × 30 = **750MB/mes**

**API Requests:**
- Requests/día: ~500
- **Mensual**: 500 × 30 = **15,000 requests/mes**
- ✅ **Hobby Plan suficiente** (100,000 requests límite)

**Total Bandwidth estimado:**
- **Promedio**: ~8-10GB/mes
- **Pico**: ~30-35GB/mes
- ✅ **Hobby Plan suficiente** (100GB límite)

#### **Cálculo de Funciones Serverless:**

**Tiempo de ejecución:**
- API calls/día: ~500
- Tiempo promedio: ~200ms por call
- **GB-horas/día**: (500 × 0.2s × 128MB) / (3600s × 1024MB) ≈ 0.003 GB-horas/día
- **Mensual**: 0.003 × 30 = **0.09 GB-horas/mes**
- ✅ **Hobby Plan suficiente** (100GB-horas límite)

#### **Costo Mensual:**

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Hobby (Gratis) | **$0** |
| **Supabase** | Free Tier | **$0** |
| **Cloudinary** | Free Tier | **$0** |
| **Resend** | Free Tier | **$0** |
| **Dominio** | Cloudflare | **$1/mes** |
| **Total** | | **$1/mes** |

**✅ Conclusión: Hobby Plan es suficiente**

---

### **Escenario 2: Crecimiento (500-2,000 estudiantes)**

#### **Suposiciones:**
- 500-2,000 estudiantes activos
- 20-50 colegios
- ~5,000 exámenes/mes
- ~300 sesiones/día promedio
- ~1,000 sesiones/día pico
- Tamaño promedio de página: ~500KB
- Tamaño promedio de API response: ~50KB

#### **Cálculo de Bandwidth:**

**Páginas estáticas y assets:**
- Sesiones/día: 300 promedio, 1,000 pico
- Páginas por sesión: ~10 páginas
- Tamaño por página: ~500KB
- **Diario**: 300 × 10 × 500KB = 1.5GB/día promedio
- **Mensual**: 1.5GB × 30 = **45GB/mes** (promedio)
- **Pico**: 1,000 × 10 × 500KB = 5GB/día = **150GB/mes** (pico)

**API calls:**
- Requests/día: ~3,000
- Tamaño promedio: ~50KB
- **Mensual**: 3,000 × 50KB × 30 = **4.5GB/mes**

**API Requests:**
- Requests/día: ~3,000
- **Mensual**: 3,000 × 30 = **90,000 requests/mes**
- ✅ **Hobby Plan suficiente** (100,000 requests límite)

**Total Bandwidth estimado:**
- **Promedio**: ~50GB/mes
- **Pico**: ~155GB/mes
- ⚠️ **Hobby Plan puede ser insuficiente en picos** (100GB límite)
- ✅ **Pro Plan recomendado** (1,000GB límite, suficiente)

#### **Cálculo de Funciones Serverless:**

**Tiempo de ejecución:**
- API calls/día: ~3,000
- Tiempo promedio: ~200ms por call
- **GB-horas/día**: (3,000 × 0.2s × 128MB) / (3600s × 1024MB) ≈ 0.02 GB-horas/día
- **Mensual**: 0.02 × 30 = **0.6 GB-horas/mes**
- ✅ **Pro Plan suficiente** (1,000GB-horas límite)

#### **Costo Mensual:**

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Pro ($20/usuario) | **$20** |
| **Supabase** | Pro | **$25** |
| **Cloudinary** | Plus | **$89** |
| **Resend** | Pro | **$20** |
| **Dominio** | Cloudflare | **$1/mes** |
| **Total** | | **$155/mes** |

**✅ Conclusión: Pro Plan necesario**

---

### **Escenario 3: Escala (2,000-10,000 estudiantes)**

#### **Suposiciones:**
- 2,000-10,000 estudiantes activos
- 50-200 colegios
- ~20,000 exámenes/mes
- ~1,500 sesiones/día promedio
- ~5,000 sesiones/día pico
- Tamaño promedio de página: ~500KB
- Tamaño promedio de API response: ~50KB

#### **Cálculo de Bandwidth:**

**Páginas estáticas y assets:**
- Sesiones/día: 1,500 promedio, 5,000 pico
- Páginas por sesión: ~10 páginas
- Tamaño por página: ~500KB
- **Diario**: 1,500 × 10 × 500KB = 7.5GB/día promedio
- **Mensual**: 7.5GB × 30 = **225GB/mes** (promedio)
- **Pico**: 5,000 × 10 × 500KB = 25GB/día = **750GB/mes** (pico)

**API calls:**
- Requests/día: ~15,000
- Tamaño promedio: ~50KB
- **Mensual**: 15,000 × 50KB × 30 = **22.5GB/mes**

**API Requests:**
- Requests/día: ~15,000
- **Mensual**: 15,000 × 30 = **450,000 requests/mes**
- ✅ **Pro Plan suficiente** (1,000,000 requests límite)

**Total Bandwidth estimado:**
- **Promedio**: ~250GB/mes
- **Pico**: ~775GB/mes
- ✅ **Pro Plan suficiente** (1,000GB límite)

#### **Cálculo de Funciones Serverless:**

**Tiempo de ejecución:**
- API calls/día: ~15,000
- Tiempo promedio: ~200ms por call
- **GB-horas/día**: (15,000 × 0.2s × 128MB) / (3600s × 1024MB) ≈ 0.1 GB-horas/día
- **Mensual**: 0.1 × 30 = **3 GB-horas/mes**
- ✅ **Pro Plan suficiente** (1,000GB-horas límite)

#### **Costo Mensual:**

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Pro ($20/usuario) | **$20** |
| **Supabase** | Team | **$599** |
| **Cloudinary** | Advanced | **$224** |
| **Resend** | Pro | **$20** |
| **Dominio** | Cloudflare | **$1/mes** |
| **Total** | | **$864/mes** |

**✅ Conclusión: Pro Plan suficiente, pero otros servicios escalan más**

---

## 💰 Resumen de Costos Vercel

### **Solo Vercel (sin otros servicios):**

| Escenario | Plan | Costo Mensual | Notas |
|-----------|------|---------------|-------|
| **Inicio (0-500)** | Hobby | **$0** | ✅ Gratis, suficiente |
| **Crecimiento (500-2K)** | Pro | **$20** | ⚠️ Necesario por bandwidth en picos |
| **Escala (2K-10K)** | Pro | **$20** | ✅ Suficiente (1TB bandwidth) |

### **Stack Completo (Vercel + Otros Servicios):**

| Escenario | Vercel | Otros Servicios | Total Mensual |
|-----------|--------|-----------------|---------------|
| **Inicio (0-500)** | $0 | $1 (dominio) | **$1/mes** |
| **Crecimiento (500-2K)** | $20 | $135 (Supabase+Cloudinary+Resend+dominio) | **$155/mes** |
| **Escala (2K-10K)** | $20 | $844 (Supabase+Cloudinary+Resend+dominio) | **$864/mes** |

---

## 📊 Factores que Afectan el Costo

### **1. Bandwidth (Tráfico)**
- **Hobby**: 100GB/mes gratis
- **Pro**: Ilimitado
- **Factores que aumentan bandwidth:**
  - Más estudiantes activos
  - Más páginas visitadas por sesión
  - Assets más pesados (imágenes, videos)
  - Picos de tráfico (exámenes simultáneos)

### **2. Funciones Serverless (Compute)**
- **Hobby**: 100GB-horas/mes gratis
- **Pro**: 1,000GB-horas/mes
- **Factores que aumentan compute:**
  - Más API calls
  - Consultas complejas a la base de datos
  - Generación de reportes PDF
  - Procesamiento de datos

### **3. Builds (Compilaciones)**
- ✅ **Ilimitados en ambos planes**
- No afecta el costo directamente

### **4. Team Members (Solo Pro)**
- **Pro**: $20/mes por usuario del equipo
- Si tienes 3 desarrolladores: $20 × 3 = $60/mes

---

## 🎯 Optimizaciones para Reducir Costos

### **1. Optimizar Bandwidth:**
- ✅ **Comprimir imágenes** (WebP, optimización)
- ✅ **CDN para assets estáticos** (Vercel Edge Network incluido)
- ✅ **Lazy loading** de imágenes y componentes
- ✅ **Cache de assets** (headers apropiados)
- ✅ **Minificar CSS/JS** (Next.js lo hace automáticamente)

### **2. Optimizar Funciones Serverless:**
- ✅ **Cache de respuestas API** (usar `revalidate`)
- ✅ **Optimizar consultas de base de datos** (índices, queries eficientes)
- ✅ **Usar Edge Functions** cuando sea posible (más baratas)
- ✅ **Limitar tiempo de ejecución** (optimizar código)

### **3. Optimizar Builds:**
- ✅ **Incremental Static Regeneration (ISR)** para páginas estáticas
- ✅ **Builds solo cuando hay cambios** (Vercel lo hace automáticamente)

---

## 📈 Proyección de Crecimiento

### **Mes 1-6: Inicio**
- Estudiantes: 0 → 500
- **Costo Vercel**: $0 (Hobby)
- **Costo Total**: $1-25/mes

### **Mes 7-18: Crecimiento**
- Estudiantes: 500 → 2,000
- **Costo Vercel**: $20 (Pro)
- **Costo Total**: $155/mes

### **Mes 19+: Escala**
- Estudiantes: 2,000 → 10,000+
- **Costo Vercel**: $20 (Pro)
- **Costo Total**: $864/mes (pero otros servicios escalan más)

---

## ⚠️ Límites y Consideraciones

### **Hobby Plan - Límites:**
- ✅ 100GB bandwidth/mes
- ✅ 100,000 requests/mes
- ✅ 100GB-horas funciones/mes
- ⚠️ Si excedes: Puedes seguir usando pero con rate limiting
- ⚠️ No hay soporte prioritario

### **Pro Plan - Límites:**
- ✅ 1,000GB (1TB) bandwidth/mes
- ✅ 1,000,000 requests/mes
- ✅ 1,000GB-horas funciones/mes
- ⚠️ Si excedes bandwidth: $0.15 por GB adicional
- ⚠️ Si excedes funciones: $0.18 por GB-hora adicional
- ⚠️ Si excedes requests: $0.60 por cada 1M requests adicionales
- ✅ Soporte prioritario

### **Cuándo Necesitas Enterprise:**
- Más de 10,000 estudiantes activos
- Necesitas SLA garantizado
- Necesitas soporte 24/7
- Necesitas features de seguridad avanzados
- Necesitas custom pricing

---

## 💡 Recomendación Final

### **Para Empezar (0-500 estudiantes):**
- ✅ **Hobby Plan**: $0/mes
- ✅ Suficiente para bandwidth y funciones
- ✅ Cron jobs incluidos
- **Costo total**: $1-25/mes (solo otros servicios)

### **Al Crecer (500-2,000 estudiantes):**
- ✅ **Pro Plan**: $20/mes
- ✅ 1TB bandwidth suficiente (puede haber picos de ~155GB)
- ✅ 1M requests suficiente (~90K estimados)
- ✅ Funciones suficientes
- **Costo total**: $155/mes (incluyendo otros servicios)
- **Costo solo Vercel**: $20/mes (fijo, sin sorpresas)

### **A Escala (2,000-10,000 estudiantes):**
- ✅ **Pro Plan**: $20/mes (suficiente)
- ✅ 1TB bandwidth suficiente (~250GB promedio, ~775GB pico)
- ✅ 1M requests suficiente (~450K estimados)
- ⚠️ Otros servicios escalan más (Supabase $599, Cloudinary $224)
- **Costo total**: $864/mes (Vercel solo $20, otros $844)
- **Costo solo Vercel**: $20/mes (fijo, predecible)

---

## 📝 Conclusión

**Vercel es muy económico y predecible:**
- ✅ **Gratis al inicio** (Hobby Plan)
- ✅ **Solo $20/mes al crecer** (Pro Plan)
- ✅ **1TB bandwidth incluido** (suficiente para 10K estudiantes)
- ✅ **1M requests incluidos** (suficiente para alto tráfico)
- ✅ **Cron jobs incluidos** (sin costo adicional)
- ✅ **Excelente para Next.js** (optimizado para React/Next.js)
- ✅ **Sin sorpresas**: Costo fijo, fácil de predecir

**El costo real viene de otros servicios:**
- Supabase: $0 → $25 → $599 (escala más rápido)
- Cloudinary: $0 → $89 → $224 (escala más rápido)
- Resend: $0 → $20 → $20 (estable)

**Vercel representa solo el 0-13% del costo total** según el escenario:
- **Inicio**: $0 de $1 = 0%
- **Crecimiento**: $20 de $155 = 13%
- **Escala**: $20 de $864 = 2.3%

**Ventajas de Vercel:**
1. ✅ **Costo predecible**: $0 o $20/mes, sin sorpresas
2. ✅ **Escalabilidad automática**: No necesitas cambiar de plan hasta 10K+ estudiantes
3. ✅ **Cron jobs incluidos**: Sin costo adicional
4. ✅ **Optimización automática**: Edge Network, CDN, etc.
5. ✅ **Deploy automático**: Con cada push a Git

**Desventajas:**
1. ⚠️ **Bandwidth limitado en Hobby**: 100GB puede ser poco en picos
2. ⚠️ **Requests limitados**: 100K en Hobby puede ser poco con mucho tráfico
3. ⚠️ **Costo por usuario en Pro**: $20/mes por cada miembro del equipo

**Recomendación:**
- ✅ **Empezar con Hobby** (gratis)
- ✅ **Migrar a Pro cuando**: 
  - Bandwidth > 80GB/mes (margen de seguridad)
  - Requests > 80K/mes (margen de seguridad)
  - Necesitas soporte prioritario
  - Necesitas team features

