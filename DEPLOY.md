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

### Build y Run Local:
```bash
# Construir imagen
docker build -t clinic-crm .

# Ejecutar
docker run -p 3000:3000 clinic-crm
```

### Docker Compose:
```yaml
# docker-compose.yml
version: '3.8'
services:
  clinic-crm:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
docker-compose up -d
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
```nginx
# /etc/nginx/sites-available/clinic-crm
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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

¡Tu CRM estará listo en minutos! 🚀
