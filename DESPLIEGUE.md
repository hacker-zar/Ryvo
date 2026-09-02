# Despliegue y login con Google

Nota operativa. No es documentación de código: es la configuración que vive
**fuera** del repo (Vercel, Supabase, Google Cloud) y que no se puede deducir
leyendo los archivos.

## Dominio de producción

**`https://ryvo-arg.vercel.app`** — este es el único dominio que se le pasa a
un negocio.

El proyecto de Vercel tiene cuatro dominios apuntando al mismo deploy:

| Dominio | Uso |
|---|---|
| `ryvo-arg.vercel.app` | **El oficial.** El que se comparte. |
| `peloqueria-producto.vercel.app` | Histórico, de antes del nombre RYVO |
| `ryvo-agronex.vercel.app` | Alias automático del team |
| `ryvo-git-main-agronex.vercel.app` | Alias de rama, generado por Vercel |

Los tres últimos funcionan y sirven exactamente lo mismo, y ahí está el
problema: **el login con Google se rompe si alguien entra por uno que no esté
en la allowlist de Supabase.**

### Por qué el dominio importa para el login

El botón "Continuar con Google" arma su URL de retorno con
`window.location.origin` (ver `login-form.tsx` y `GoogleLinkPanel.tsx`):

```
${window.location.origin}/auth/callback?flow=admin-login&business=<slug>
```

O sea que **vuelve al mismo dominio desde el que se entró**. Si un dueño abre
`ryvo-agronex.vercel.app`, Google intenta devolverlo ahí — y si ese dominio no
está autorizado en Supabase, termina en la Site URL configurada en vez de en su
panel.

No es un bug: es la consecuencia correcta de no fijar un dominio. La solución
es usar uno solo, no cambiar el código.

## Configuración externa requerida

### Supabase → Authentication → URL Configuration

- **Site URL:** `https://ryvo-arg.vercel.app`
- **Redirect URLs:**
  - `https://ryvo-arg.vercel.app/auth/callback`
  - `https://ryvo-arg.vercel.app/**`
  - `http://localhost:3000/auth/callback` *(solo para desarrollo)*

### Google Cloud Console → OAuth Client → Authorized redirect URIs

- `https://bljciiyjvqysqqqetcgv.supabase.co/auth/v1/callback`

Google le habla a Supabase, no a la app: esa URI es la del proyecto de
Supabase y **no cambia** aunque cambie el dominio de la app.

## Diagnóstico ya hecho: "localhost rechazó la conexión"

Si al probar Google aparece `ERR_CONNECTION_REFUSED` en `localhost`, casi
siempre es lo mismo y no tiene nada que ver con Google: **el servidor de
desarrollo no está corriendo**. Google autentica bien y devuelve a
`http://localhost:3000/auth/callback`, donde no hay nada escuchando.

```bash
npm run dev
```

Dos cosas más que confunden y no son fallas:

- **El botón de Google solo aparece con `?business=<slug>` en la URL.** En
  `/admin/login` a secas (login de superadmin de RYVO) no existe, a propósito:
  Google login es para cuentas Owner/Barber, no para superadmin ni partner.
- **Si el server corre en otro puerto** (por ejemplo 3001 con `ryvo-prod`), el
  retorno apunta a ese puerto. Hay que autorizarlo en Supabase o usar 3000.

## Despliegue

`main` está conectado al proyecto `ryvo` de Vercel: **cada push a `main`
despliega a producción automáticamente.** No hay paso manual.

Las migraciones de Supabase **no** viajan con el deploy. Se aplican aparte y
antes, o la app queda pidiendo columnas que todavía no existen (falla silenciosa
ya vivida en este proyecto). Ver `supabase/migrations/`.
