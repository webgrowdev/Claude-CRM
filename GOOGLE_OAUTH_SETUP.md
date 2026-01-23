# Configuración de Google Calendar OAuth 2.0

Esta guía te ayudará a configurar la integración con Google Calendar para el CRM.

## ⚠️ ERROR COMÚN: "This app doesn't comply with Google's OAuth 2.0 policy"

### 🔴 Si YA configuraste todo pero aún ves este error:

**➡️ LEE ESTE ARCHIVO: [`GOOGLE_OAUTH_TESTING_MODE.md`](./GOOGLE_OAUTH_TESTING_MODE.md)**

El 99% de las veces este error significa que **tu email NO está en la lista de "Test Users"** en Google Cloud Console.

### 🟢 Si es tu primera vez configurando:

Continúa leyendo esta guía paso a paso.

---

## Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el menú desplegable de proyectos (arriba a la izquierda)
3. Haz clic en "Nuevo Proyecto"
4. Asigna un nombre (ej: "Clinic CRM")
5. Haz clic en "Crear"

---

## Paso 2: Habilitar la API de Google Calendar

1. En el menú lateral, ve a **"APIs & Services"** > **"Library"**
2. Busca **"Google Calendar API"**
3. Haz clic en ella y luego en **"Enable"** (Habilitar)

---

## Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **"APIs & Services"** > **"OAuth consent screen"**
2. Selecciona **"External"** (usuario externo)
3. Haz clic en **"Create"**

### Información de la Aplicación:
- **App name**: Clinic CRM (o el nombre que prefieras)
- **User support email**: Tu email
- **Developer contact information**: Tu email

4. Haz clic en **"Save and Continue"**

### Scopes (Permisos):
5. Haz clic en **"Add or Remove Scopes"**
6. Busca y agrega estos scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
7. Haz clic en **"Update"** y luego **"Save and Continue"**

### Test Users (Usuarios de Prueba):
8. Si tu app está en modo "Testing", agrega las cuentas de Google que usarás para probar
9. Haz clic en **"Add Users"** e ingresa los emails
10. Haz clic en **"Save and Continue"**

11. Revisa el resumen y haz clic en **"Back to Dashboard"**

---

## Paso 4: Crear Credenciales OAuth 2.0

1. Ve a **"APIs & Services"** > **"Credentials"**
2. Haz clic en **"Create Credentials"** > **"OAuth client ID"**
3. Selecciona **"Web application"** como tipo de aplicación

### Configurar la Aplicación Web:
4. **Name**: Clinic CRM Web Client (o el nombre que prefieras)

5. **Authorized JavaScript origins**: (Opcional para Calendar API)
   - `http://localhost:3000` (para desarrollo)
   - `https://tu-dominio.com` (para producción)

6. **Authorized redirect URIs**: ⚠️ **MUY IMPORTANTE** ⚠️
   - `http://localhost:3000/api/auth/callback/google` (para desarrollo)
   - `https://tu-dominio.com/api/auth/callback/google` (para producción)

   > **Nota**: La URL de redirección debe coincidir EXACTAMENTE con la que usa tu aplicación. Si usas un puerto diferente (ej: 3001), debes agregarlo aquí.

7. Haz clic en **"Create"**

### Guardar Credenciales:
8. Se mostrará un modal con tu **Client ID** y **Client Secret**
9. **COPIA ESTOS VALORES** - los necesitarás para el siguiente paso
10. Haz clic en **"OK"**

---

## Paso 5: Configurar Variables de Entorno

1. En la raíz de tu proyecto, crea un archivo `.env.local` (si no existe)
2. Copia el contenido de `.env.example` a `.env.local`
3. Reemplaza los valores con tus credenciales:

```bash
# Client ID de Google OAuth (visible en el navegador)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-real.apps.googleusercontent.com

# Client ID y Secret para el servidor (solo backend)
GOOGLE_CLIENT_ID=tu-client-id-real.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-real

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Importante**:
> - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_ID` deben tener el **mismo valor**
> - NUNCA subas el archivo `.env.local` a Git
> - NUNCA compartas tu `GOOGLE_CLIENT_SECRET`

---

## Paso 6: Reiniciar el Servidor de Desarrollo

Después de configurar las variables de entorno:

```bash
# Detén el servidor (Ctrl + C)
# Inicia nuevamente
npm run dev
```

---

## Paso 7: Probar la Conexión

1. Ve a tu aplicación: `http://localhost:3000/settings/integrations`
2. Haz clic en **"Conectar Google Calendar"**
3. Serás redirigido a Google
4. Selecciona tu cuenta de Google
5. Acepta los permisos solicitados
6. Deberías ser redirigido de vuelta a tu app con la conexión exitosa

---

## Solución de Problemas

### Error: "redirect_uri_mismatch"
**Causa**: La URL de redirección no coincide con la registrada en Google Console.

**Solución**:
1. Verifica que la URL en Google Console sea EXACTAMENTE: `http://localhost:3000/api/auth/callback/google`
2. Asegúrate de que `NEXT_PUBLIC_APP_URL` en `.env.local` sea `http://localhost:3000`
3. Reinicia el servidor de desarrollo

### Error: "This app doesn't comply with Google's OAuth 2.0 policy"
**Causa**: La aplicación no está configurada correctamente o falta información.

**Solución**:
1. Verifica que hayas completado la pantalla de consentimiento OAuth
2. Asegúrate de que los 3 scopes estén agregados
3. Si es necesario, agrega tu email como "Test User"
4. Verifica que las credenciales OAuth estén creadas como "Web application"

### Error: "invalid_client"
**Causa**: El Client ID o Client Secret son incorrectos.

**Solución**:
1. Verifica que copiaste correctamente el Client ID y Secret
2. Asegúrate de que no haya espacios extra al inicio o final
3. Confirma que `GOOGLE_CLIENT_ID` y `NEXT_PUBLIC_GOOGLE_CLIENT_ID` tengan el mismo valor

### Error: "access_denied"
**Causa**: El usuario rechazó los permisos o la aplicación no tiene acceso.

**Solución**:
1. Si la app está en modo "Testing", asegúrate de que tu cuenta esté en la lista de Test Users
2. Intenta nuevamente y acepta todos los permisos
3. Si persiste, verifica que los scopes estén correctamente configurados

### La conexión funciona pero no puedo crear eventos
**Causa**: Los permisos pueden estar limitados o los scopes no están correctos.

**Solución**:
1. Verifica que los 3 scopes estén configurados:
   - `calendar` (leer/escribir calendarios)
   - `calendar.events` (crear/modificar eventos)
   - `userinfo.email` (obtener email del usuario)
2. Desconecta y vuelve a conectar para forzar nuevos permisos
3. Revisa que en "OAuth consent screen" los scopes estén marcados como "Not sensitive" o aprobados

---

## Publicar la Aplicación (Para Producción)

Cuando estés listo para producción:

1. Ve a **"OAuth consent screen"**
2. Haz clic en **"Publish App"**
3. Si usas scopes sensibles (como `calendar`), necesitarás verificación de Google
   - Este proceso puede tomar varios días
   - Sigue las instrucciones de Google para la verificación

**Mientras tanto**: Puedes mantener la app en modo "Testing" y agregar hasta 100 usuarios de prueba.

---

## Referencias Útiles

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth Consent Screen Setup](https://support.google.com/cloud/answer/6158849)

---

## Notas de Seguridad

1. **NUNCA** expongas tu `GOOGLE_CLIENT_SECRET` en el código del frontend
2. **NUNCA** subas el archivo `.env.local` a Git
3. Usa variables de entorno diferentes para desarrollo y producción
4. Revoca las credenciales inmediatamente si crees que fueron comprometidas
5. Monitorea el uso de la API en Google Cloud Console

---

Si sigues teniendo problemas después de seguir esta guía, revisa los logs en la consola del navegador y del servidor para obtener más detalles sobre el error.
