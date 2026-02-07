# Guía de Despliegue - Clinic CRM

## Opción 1: Vercel (Recomendado - Gratis)

La forma más fácil y rápida:

### Paso a Paso:

1. **Sube el código a GitHub**
   ```bash
   # Si aún no tienes un repo en GitHub, créalo y luego:
   git remote add origin https://github.com/TU_USUARIO/clinic-crm.git
   git push -u origin main
   ```

2. **Despliega en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Crea una cuenta (gratis con GitHub)
   - Click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente Next.js
   - Click en "Deploy"

3. **¡Listo!**
   - Tu app estará en: `https://tu-proyecto.vercel.app`
   - Cada push a `main` desplegará automáticamente

### Con CLI de Vercel:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Para producción
vercel --prod
```

---

## Opción 2: Netlify (Gratis)

1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio
3. Configura:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Deploy

---

## Opción 3: Railway (Simple + Backend Ready)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Iniciar proyecto
railway init

# Desplegar
railway up
```

O desde [railway.app](https://railway.app):
1. New Project → Deploy from GitHub
2. Selecciona el repo
3. Railway detecta Next.js automáticamente

---

## Opción 4: Docker

### Build y Run Local (desarrollo):
```bash
# Construir imagen
docker build -t clinic-crm .

# Ejecutar
docker run -p 3000:3000 clinic-crm
```

### Docker Compose (Producción - Recomendado):

El repositorio incluye un `docker-compose.yml` completo con Nginx como reverse proxy para servir archivos estáticos correctamente:

```bash
# 1. Crear archivo .env con tus variables de Supabase
cp .env.example .env
# Edita .env con tus credenciales

# 2. Construir y levantar servicios
docker-compose up -d --build

# 3. Ver logs
docker-compose logs -f

# 4. Verificar que todo funciona
curl http://localhost
```

**¿Qué incluye el docker-compose.yml?**
- ✅ Servicio de Next.js (clinic-crm)
- ✅ Nginx como reverse proxy
- ✅ Volúmenes compartidos para archivos estáticos (`/_next/static/`)
- ✅ Configuración de caché correcta
- ✅ Headers de proxy necesarios
- ✅ Health checks
- ✅ Auto-restart en caso de errores

**Comandos útiles:**
```bash
# Reconstruir sin caché (útil para troubleshooting)
docker-compose build --no-cache

# Detener servicios
docker-compose down

# Ver archivos estáticos dentro del contenedor
docker exec clinic-crm-app ls -la /app/.next/static
docker exec clinic-crm-nginx ls -la /app/.next/static
```

### Desplegar en servicios de contenedores:
- **Google Cloud Run**
- **AWS ECS/Fargate**
- **Azure Container Apps**
- **DigitalOcean App Platform**

---

## Opción 5: VPS (DigitalOcean, Linode, etc.)

### Con PM2:
```bash
# En tu servidor
git clone tu-repo
cd clinic-crm

# Instalar dependencias
npm install

# Build
npm run build

# Instalar PM2
npm i -g pm2

# Iniciar con PM2
pm2 start npm --name "clinic-crm" -- start

# Guardar para reinicio automático
pm2 save
pm2 startup
```

### Con Nginx como proxy:

**⚠️ IMPORTANTE:** Para evitar errores 404 en archivos estáticos (`/_next/static/`), necesitas configurar Nginx correctamente.

```nginx
# /etc/nginx/sites-available/clinic-crm
server {
    listen 80;
    server_name tu-dominio.com;

    # Máximo tamaño de subida
    client_max_body_size 10M;

    # Servir archivos estáticos de Next.js directamente
    # Estos archivos tienen hash en el nombre y son inmutables
    location /_next/static/ {
        # Ajusta esta ruta según dónde esté tu build
        alias /var/www/clinic-crm/.next/static/;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Servir archivos públicos (favicon, imágenes, etc.)
    location ~* ^/(favicon\.ico|manifest\.json|images/|assets/|icons/) {
        root /var/www/clinic-crm/public;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }

    # Proxear todas las demás peticiones a Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Headers necesarios para Next.js
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/clinic-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL con Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## Variables de Entorno (Opcional)

Si necesitas configuración adicional, crea un archivo `.env.local`:

```env
# API URLs (para futuras integraciones)
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com

# Analytics (opcional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Dominio Personalizado

### En Vercel:
1. Settings → Domains
2. Add Domain
3. Configura DNS en tu registrador:
   - CNAME: `cname.vercel-dns.com`

### En otros servicios:
Configura un registro A apuntando a la IP del servidor.

---

## Checklist Pre-Despliegue

- [ ] Código commiteado y pusheado
- [ ] `npm run build` funciona sin errores
- [ ] Probado localmente con `npm run start`
- [ ] Variables de entorno configuradas (si aplica)
- [ ] Dominio configurado (opcional)

---

## Soporte

Si tienes problemas:
1. Revisa los logs del build
2. Asegúrate de tener Node.js 18+
3. Verifica que `npm run build` funciona localmente

---

## 🔧 Troubleshooting: Errores de Archivos Estáticos

### Síntoma: Errores 404 en archivos CSS/JS

```
Refused to apply style from 'https://tu-dominio.com/_next/static/css/xxx.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type

ChunkLoadError: Loading chunk 185 failed.
Failed to load resource: the server responded with a status of 404
```

### Causas Comunes:

#### 1. **Nginx no está sirviendo `/_next/static/` correctamente**

**Solución:** Asegúrate de tener el bloque `location /_next/static/` en tu configuración de Nginx (ver Opción 5 arriba).

#### 2. **Los archivos estáticos no existen en el contenedor**

**Verificar:**
```bash
# Si usas Docker Compose
docker exec clinic-crm-app ls -la /app/.next/static
docker exec clinic-crm-nginx ls -la /app/.next/static

# Si usas contenedor standalone
docker exec <container-name> ls -la /app/.next/static
```

**Solución:** Si los archivos no están, reconstruye con:
```bash
docker-compose build --no-cache
docker-compose up -d
```

#### 3. **Los hashes de archivos no coinciden**

Esto ocurre cuando el HTML referencia un archivo `abc123.css` pero en disco está `def456.css`.

**Verificar:**
```bash
# Ver el HTML generado
curl http://localhost | grep "_next/static"

# Comparar con archivos en disco
docker exec clinic-crm-app find /app/.next/static -name "*.css"
```

**Solución:** Limpia todo y reconstruye:
```bash
# Local
rm -rf .next node_modules
npm install
npm run build

# Docker
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### 4. **CDN/Cloudflare está cacheando errores 404**

**Solución:**
- Purga el caché de tu CDN/Cloudflare
- Espera 5-10 minutos para propagación
- Verifica directamente con la IP del servidor (sin CDN):
  ```bash
  curl -I http://TU_IP_SERVIDOR/_next/static/css/...
  ```

#### 5. **Browser cache con versión vieja**

**Solución:**
- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
- O abre en ventana privada/incógnito

---

### Verificación Paso a Paso

```bash
# 1. Verificar que Next.js build funciona
npm run build
npm run start  # Probar en http://localhost:3000

# 2. Si usas Docker, verificar archivos en contenedor
docker-compose up -d --build
docker exec clinic-crm-app ls -laR /app/.next/static | head -50
docker exec clinic-crm-app ls -la /app/public

# 3. Verificar que Nginx puede acceder a los archivos
docker exec clinic-crm-nginx ls -la /app/.next/static

# 4. Probar endpoint directamente
curl -I http://localhost/_next/static/css/<nombre-archivo>.css
# Debería retornar: HTTP/1.1 200 OK

# 5. Ver logs de Nginx
docker-compose logs nginx

# 6. Ver logs de Next.js
docker-compose logs clinic-crm
```

### Logs Útiles

```bash
# Docker Compose logs en tiempo real
docker-compose logs -f

# Solo Nginx
docker-compose logs -f nginx

# Solo Next.js app
docker-compose logs -f clinic-crm
```

---

¡Tu CRM estará listo en minutos! 🚀
