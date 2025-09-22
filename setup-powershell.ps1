# Script de configuración para EducaSaber LMS
Write-Host "🚀 Configurando EducaSaber LMS para desarrollo local..." -ForegroundColor Green

# Configurar PATH temporalmente
$env:PATH += ";C:\Program Files\nodejs"

# Verificar Node.js
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & "C:\Program Files\nodejs\node.exe" --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "📋 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = & "C:\Program Files\nodejs\npm.cmd" --version
    Write-Host "✅ npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npm no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
try {
    & "C:\Program Files\nodejs\npm.cmd" install
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

# Generar cliente de Prisma
Write-Host "🔧 Generando cliente de Prisma..." -ForegroundColor Yellow
try {
    & "C:\Program Files\nodejs\npx.cmd" prisma generate
    Write-Host "✅ Cliente de Prisma generado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generando cliente de Prisma" -ForegroundColor Red
    exit 1
}

# Crear base de datos
Write-Host "🗄️ Creando base de datos SQLite..." -ForegroundColor Yellow
try {
    & "C:\Program Files\nodejs\npx.cmd" prisma db push
    Write-Host "✅ Base de datos creada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creando base de datos" -ForegroundColor Red
    exit 1
}

Write-Host "🎯 Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Para iniciar el servidor de desarrollo:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📋 Para ver la base de datos:" -ForegroundColor Cyan
Write-Host "   npx prisma studio" -ForegroundColor White 