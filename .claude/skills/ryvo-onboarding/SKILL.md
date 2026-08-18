---
name: ryvo-onboarding
description: Cargar los datos de un negocio nuevo (barbería/peluquería cliente) y crear/publicar su página en la plataforma RYVO de producción. Tres modos — RESEARCH MODE (investigar públicamente Instagram/web/Google Maps/Facebook/TikTok de un negocio, sin tocar producción), ONBOARDING MODE (ejecutar la carga con datos ya confirmados) y COMPLETE MODE (el uso normal: investigar todo lo posible, preguntar solo lo que falta, y ejecutar tras aprobación). Usar cuando el usuario pida cargar, dar de alta, investigar, configurar o crear la página de un negocio nuevo en RYVO, o pegue/adjunte identificadores públicos o datos de un cliente para subir a la plataforma. Requiere también el contexto general del proyecto (skill `ryvo`) — cargarlo si no está ya en la sesión.
---

# RYVO — Onboarding de negocios (investigación + carga de datos + publicación)

Procedimiento operativo para lo que en el proyecto se llama "onboarding
asistido": nosotros (RYVO) cargamos los datos del cliente en su lugar. No
es una feature de código — es un procedimiento sobre la plataforma ya
construida, en producción, con datos reales.

Producción: **https://ryvo-arg.vercel.app/admin**

## Los tres modos

| Modo | Qué hace | Toca producción | Referencia |
|---|---|---|---|
| **RESEARCH** | Investiga públicamente, entrega un informe de confianza | No, nunca | `references/research-mode.md` |
| **ONBOARDING** | Ejecuta la carga con datos ya dados/confirmados; solo busca algo puntual si se lo piden explícitamente | Sí, tras confirmación | `references/onboarding-mode.md` |
| **COMPLETE** | Investiga + normaliza + valida + pregunta solo lo necesario + ejecuta tras aprobación — orquesta a los otros dos | Sí, tras aprobación | `references/complete-mode.md` |

**COMPLETE MODE es el modo de uso normal** cuando el pedido es del tipo
"configurá este negocio: Instagram @tal". No duplica lógica: sus fases
son, literalmente, pasos de `research-mode.md` y `onboarding-mode.md` —
ver el mapeo al principio de `complete-mode.md`.

## Cómo elegir el modo al arrancar

- El usuario da una identificación básica del negocio (Instagram, nombre,
  web, Google Maps, o combinación) y quiere que se resuelva todo →
  **COMPLETE MODE** (`references/complete-mode.md`).
- El usuario pide explícitamente solo investigar, sin cargar nada todavía
  (ej. "investigá este negocio antes de que le pida nada al cliente", sin
  pedir que se ejecute después) → **RESEARCH MODE**
  (`references/research-mode.md`).
- El usuario ya tiene los datos completos y confirmados (se los pasó él
  mismo, o ya aprobó un informe de research previo) y solo quiere que se
  cargue → **ONBOARDING MODE** (`references/onboarding-mode.md`).

Ante la duda, preferir COMPLETE MODE — es el que mejor sabe cuándo
preguntar y cuándo no.

## Arquitectura general

```
INPUT (identificadores públicos y/o datos que mandó el cliente)
        │
        ▼
COMPLETE MODE ─── Fase A-C: RESEARCH + normalizar + validar
        │          (= research-mode.md, pasos 1-7)
        ▼
   Fase D-E: informe + preguntas puntuales + tu aprobación
        │          (= research-mode.md paso 8-9, + criterio crítico/no-crítico)
        ▼
   Fase F-G: ONBOARDING + QA
        │          (= onboarding-mode.md, pasos 3-5)
        ▼
     ADMIN RYVO → publicación → verificación
```

RESEARCH MODE y ONBOARDING MODE siguen siendo invocables por separado
(por ejemplo, si el usuario solo quiere el informe, o si ya tiene todo
confirmado y quiere saltar directo a cargar) — COMPLETE MODE es la
orquestación de ambos, no un tercer camino con lógica propia.

## Reglas duras (no negociables, aplican a los tres modos)

- **Nunca tipear una contraseña**, en ningún campo ni en ningún sitio:
  login de superadmin, campo `password` de `NewBusinessForm` (cuenta del
  dueño), `AdminPasswordForm`/`account-manager`, ni un login de terceros
  (Instagram, Facebook, Google) durante la investigación. Si hace falta
  una, parar y pedirle al usuario que la escriba él mismo.
- **No tocar producción antes de la aprobación del usuario** — ni crear el
  negocio, ni completar el editor, ni publicar — sin importar cuán segura
  parezca la información (investigada o dada por el cliente).
- **No inventar ni completar con placeholders** datos que no están
  confirmados. Si falta algo crítico (horarios, al menos un servicio,
  nombre/slug), preguntar — nunca rellenar con un valor "razonable". Ver
  el criterio crítico/no-crítico en `complete-mode.md` Fase E.
- **Separar las superficies de navegador según lo que estás haciendo**:
  Claude in Chrome (sesión real, autenticada) es solo para la carga en
  producción dentro de `onboarding-mode.md`. El Browser pane sandboxeado
  (sin sesión) es para investigación pública en `research-mode.md` y para
  la verificación final del sitio público. No mezclarlas.
- No tocar Supabase directo ni migraciones: todo pasa por los forms/admin
  actions ya construidos (ver skill `ryvo` para el resto de las reglas del
  proyecto — RLS, `requireAdminFor`, etc.).
- Mantener trazabilidad: cualquier dato investigado debe poder rastrearse
  a su fuente (ver "Fuentes consultadas" en `research-mode.md`).
- Una aprobación no se generaliza más allá de lo que cubre: si durante la
  ejecución aparece algo nuevo que no estaba en el informe/resumen
  aprobado, parar y volver a preguntar.

## Referencias

- `references/research-mode.md` — investigación pública, regla de
  confianza (✓/⚠️/❌), manejo de conflictos entre fuentes, formato del
  informe.
- `references/onboarding-mode.md` — recolección, confirmación, creación
  del negocio, completar el editor sección por sección, publicación y QA.
- `references/complete-mode.md` — orquestación de los dos anteriores,
  formato del informe COMPLETE con preguntas al cliente, y el criterio de
  qué falta es crítico (bloquea) vs. no crítico (se puede autorizar seguir
  sin eso).
