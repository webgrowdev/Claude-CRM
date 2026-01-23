# Solución: "This app doesn't comply with Google's OAuth 2.0 policy" en Modo Testing

## 🔴 El Problema

Estás viendo este error de Google:

```
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.

You can let the app developer know that this app doesn't comply with one or more Google validation rules.
```

**Y ya verificaste que:**
- ✅ Las variables de entorno están configuradas
- ✅ Las URLs de redirección están registradas en Google Cloud Console
- ✅ Los scopes están habilitados
- ✅ La app está en modo "Testing"

---

## ✅ LA SOLUCIÓN (99% de los casos)

**El problema es que el usuario que está intentando iniciar sesión NO está en la lista de "Test Users" de tu proyecto en Google Cloud Console.**

Cuando una app OAuth está en modo "Testing", **SOLO** los usuarios que están explícitamente agregados en la lista de "Test Users" pueden autenticarse. Cualquier otro usuario recibirá este error.

---

## 📋 CHECKLIST DE VERIFICACIÓN

Sigue estos pasos EN ORDEN para diagnosticar el problema:

### ✅ Paso 1: Verificar que el usuario esté en Test Users

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **"APIs & Services"** → **"OAuth consent screen"**
4. Desplázate hacia abajo hasta la sección **"Test users"**
5. **¿Está tu email (el que usas para iniciar sesión) en la lista?**

   - ❌ **NO** → Este es tu problema. Ve al Paso 2 para agregar el usuario.
   - ✅ **SÍ** → Continúa al Paso 3.

---

### ✅ Paso 2: Agregar Usuario a Test Users

1. En la sección "Test users", haz clic en **"ADD USERS"**
2. Ingresa el email de Google que usarás para iniciar sesión
   - **IMPORTANTE**: Debe ser el email EXACTO de la cuenta de Google
   - Por ejemplo: `miusuario@gmail.com`
3. Haz clic en **"Add"**
4. Haz clic en **"SAVE"**

**⚠️ CRÍTICO**: El email debe coincidir EXACTAMENTE con la cuenta de Google que usas para iniciar sesión. Si tienes múltiples cuentas, asegúrate de agregar la correcta.

5. Espera 1-2 minutos para que los cambios se propaguen
6. Intenta conectar Google Calendar nuevamente

---

### ✅ Paso 3: Verificar Configuración de OAuth Consent Screen

Si tu usuario YA está en Test Users pero aún ves el error, verifica lo siguiente:

1. Ve a **"APIs & Services"** → **"OAuth consent screen"**
2. Verifica que **"Publishing status"** sea **"Testing"** o **"In production"**
3. Verifica que el **"User type"** sea **"External"** (no Internal, a menos que uses Google Workspace)

#### Información Obligatoria:

Asegúrate de que estos campos estén completos:

- ✅ **App name**: Debe estar lleno (ej: "Clinic CRM")
- ✅ **User support email**: Debe tener un email válido
- ✅ **Developer contact information**: Debe tener al menos un email

4. Haz clic en **"EDIT APP"** si necesitas completar información
5. Completa todos los campos obligatorios marcados con *
6. Haz clic en **"SAVE AND CONTINUE"** en cada paso

---

### ✅ Paso 4: Verificar Scopes

1. En la pantalla de **"OAuth consent screen"**, ve a la pestaña **"Scopes"**
2. Haz clic en **"EDIT"** si necesitas modificar
3. Verifica que estos 3 scopes estén agregados:

   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/userinfo.email
   ```

4. Si faltan, haz clic en **"ADD OR REMOVE SCOPES"**
5. Busca cada scope y actívalo
6. Haz clic en **"UPDATE"**
7. Haz clic en **"SAVE AND CONTINUE"**

---

### ✅ Paso 5: Verificar URLs de Redirección

1. Ve a **"APIs & Services"** → **"Credentials"**
2. Haz clic en tu **OAuth 2.0 Client ID**
3. En la sección **"Authorized redirect URIs"**, verifica que tengas:

   **Para desarrollo (localhost):**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

   **Para producción (tu dominio en Hostinger):**
   ```
   https://tudominio.com/api/auth/callback/google
   ```

   **⚠️ IMPORTANTE**:
   - Debe ser **EXACTAMENTE** esta ruta
   - NO debe tener slash al final: ~~`/google/`~~ ❌
   - Debe ser `http` para localhost y `https` para producción
   - Verifica mayúsculas/minúsculas (debe ser todo minúscula)

4. Si falta alguna URL, agrégala:
   - Haz clic en **"ADD URI"**
   - Pega la URL exacta
   - Haz clic en **"SAVE"**

---

### ✅ Paso 6: Verificar Variables de Entorno en Hostinger

1. Asegúrate de que las variables de entorno en Hostinger sean correctas:

   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=tu-client-secret
   NEXT_PUBLIC_APP_URL=https://tudominio.com
   ```

2. Verifica que:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_ID` tengan el **MISMO** valor
   - `NEXT_PUBLIC_APP_URL` sea tu dominio **CON** `https://` pero **SIN** slash final
   - No haya espacios al inicio o final de los valores
   - El Client ID termine en `.apps.googleusercontent.com`

3. Después de cambiar variables de entorno, **reinicia tu aplicación** en Hostinger

---

### ✅ Paso 7: Verificar el Client ID Correcto

A veces hay confusión entre diferentes tipos de credenciales:

1. Ve a **"APIs & Services"** → **"Credentials"**
2. Verifica que estés usando un **"OAuth 2.0 Client ID"** de tipo **"Web application"**
   - ❌ NO uses "API Key"
   - ❌ NO uses "Service account"
   - ❌ NO uses "Desktop app" o "Mobile app"
   - ✅ Debe ser **"Web application"**

3. Si creaste el tipo incorrecto:
   - Haz clic en **"CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Selecciona **"Web application"**
   - Configura las redirect URIs
   - Usa el nuevo Client ID y Secret

---

## 🧪 MODO TESTING: Limitaciones

Cuando tu app está en modo "Testing", hay limitaciones:

### Límites:
- ⚠️ **Máximo 100 test users**
- ⚠️ **Solo los test users pueden autenticarse**
- ⚠️ **Los tokens de refresh expiran después de 7 días**

### Ventajas:
- ✅ No necesitas verificación de Google
- ✅ Puedes probar inmediatamente
- ✅ Cambios se aplican rápidamente

---

## 🚀 Publicar la App (Para Todos los Usuarios)

Si quieres que **cualquier persona** pueda conectarse (no solo test users):

### Opción 1: Publicar sin Verificación (Solo scopes no sensibles)

Si solo usas scopes básicos, puedes publicar sin verificación:

1. Ve a **"OAuth consent screen"**
2. Haz clic en **"PUBLISH APP"**
3. Confirma la publicación

**Problema**: Los scopes de Calendar (`calendar`, `calendar.events`) son **sensibles** y requieren verificación.

### Opción 2: Solicitar Verificación de Google

Para usar scopes sensibles (como Calendar) en producción:

1. Ve a **"OAuth consent screen"**
2. Completa TODA la información requerida:
   - App name
   - Logo de la app (120x120 px)
   - App homepage
   - App privacy policy URL
   - App terms of service URL
   - Authorized domains

3. Haz clic en **"SUBMIT FOR VERIFICATION"**

4. Google revisará tu app (puede tomar **4-6 semanas**)

5. Mientras tanto, puedes seguir usando modo "Testing" con hasta 100 usuarios

**Recomendación**: Mantén la app en "Testing" y agrega usuarios manualmente hasta que tengas muchos usuarios. Es más rápido y evita el proceso de verificación.

---

## 🔍 DEBUGGING: Cómo Saber Cuál es el Error Exacto

Si sigues teniendo problemas, revisa los logs del servidor:

### En Desarrollo (localhost):

1. Abre la terminal donde corre `npm run dev`
2. Intenta conectar Google Calendar
3. Busca en la consola mensajes que empiecen con `OAuth callback received:`

### En Producción (Hostinger):

1. Accede a los logs de tu aplicación en Hostinger
2. Busca mensajes de error relacionados con OAuth
3. Busca específicamente:
   - `Token exchange failed`
   - `Google OAuth error`
   - `OAuth callback error`

---

## 📝 RESUMEN: Solución Rápida

**Si la app está en modo Testing:**

1. **Agrega tu email a Test Users**:
   - Google Cloud Console → APIs & Services → OAuth consent screen
   - Sección "Test users" → ADD USERS
   - Ingresa tu email → SAVE

2. **Espera 1-2 minutos**

3. **Intenta conectar nuevamente**

**Esto soluciona el 99% de los casos de este error.**

---

## 📞 Otros Casos Específicos

### Error: "Invalid Client"
- Verifica que `GOOGLE_CLIENT_ID` esté correctamente configurado
- Asegúrate de que el Client ID sea para "Web application"

### Error: "redirect_uri_mismatch"
- La URL de redirección en el código NO coincide con la registrada en Google
- Verifica que `NEXT_PUBLIC_APP_URL` esté configurado correctamente
- Asegúrate de que la URL registrada sea exacta (http vs https, con/sin www)

### Error: "Access Blocked: Authorization Error"
- La app no está configurada correctamente en OAuth consent screen
- Completa TODOS los campos obligatorios en la pantalla de consentimiento

### Error: "This app hasn't been verified"
- Normal en modo Testing - ignóralo
- Haz clic en "Advanced" → "Go to [App Name] (unsafe)"
- O agrega tu email a Test Users

---

## ✅ Checklist Final

Antes de contactar soporte, verifica:

- [ ] Mi email está en la lista de "Test users"
- [ ] La app está en modo "Testing" o "In production"
- [ ] Los 3 scopes están agregados en OAuth consent screen
- [ ] El Client ID es tipo "Web application"
- [ ] Las URLs de redirección están registradas correctamente
- [ ] Las variables de entorno están configuradas en Hostinger
- [ ] He reiniciado la aplicación después de cambiar variables
- [ ] He esperado 1-2 minutos después de agregar mi email a Test users
- [ ] Estoy usando el email correcto para iniciar sesión

---

**Si después de todo esto sigues teniendo el error, comparte:**
1. Screenshot de la sección "Test users" en OAuth consent screen
2. Screenshot de las "Authorized redirect URIs" en Credentials
3. El email exacto que estás usando para iniciar sesión
4. Los logs del servidor cuando intentas conectar
