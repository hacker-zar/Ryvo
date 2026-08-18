# COMPLETE MODE

El modo de uso normal: das solo una identificación básica del negocio
(Instagram, nombre, URL, Google Maps, o una combinación) y la skill hace
todo lo posible sola, se detiene a preguntarte solo lo que de verdad hace
falta, y ejecuta recién después de tu aprobación.

**No duplica lógica de los otros dos modos.** Cada fase de acá abajo es
literalmente un paso de `research-mode.md` o `onboarding-mode.md` — este
archivo es la orquestación y el criterio de cuándo parar a preguntar, no
una reimplementación.

```
Fase A  RESEARCH     → research-mode.md, pasos 1-2
Fase B  NORMALIZE     → research-mode.md, paso 3
Fase C  VALIDATE      → research-mode.md, pasos 4-6-7
Fase D  REVIEW        → research-mode.md, paso 8 + sección extra abajo
Fase E  APPROVAL      → research-mode.md, paso 9 + criterio crítico/no-crítico abajo
Fase F  ONBOARDING    → onboarding-mode.md, pasos 3-4 (el 1 y 2 ya están resueltos)
Fase G  QA            → onboarding-mode.md, paso 5 (Verificar)
```

## Regla fundamental

COMPLETE MODE no es "hacer todo sin preguntar". Es:

> Investigar todo lo posible → detectar qué falta → preguntar solo lo
> necesario → esperar aprobación → ejecutar.

Nunca inventar un dato para evitar una pregunta. Nunca publicar
información dudosa (⚠️ conflicto) sin que el usuario la haya resuelto.

## Fases A–C — investigar, normalizar, validar

Ejecutar `research-mode.md` completo (sus reglas específicas de esa fase
también aplican acá tal cual: nada de logins de terceros, nada de
CAPTCHAs, nada de descargar imágenes, nunca elegir arbitrariamente entre
fuentes en conflicto). El resultado interno es el mismo que produce
RESEARCH MODE — la diferencia empieza en cómo se presenta (Fase D).

## Fase D — REVIEW

Mismo contenido que el informe de `research-mode.md` (secciones NEGOCIO /
SERVICIOS / HORARIOS / PROFESIONALES / IMÁGENES / FALTANTES / CONFLICTOS /
FUENTES CONSULTADAS, con los estados ✓ CONFIRMADO / ⚠️ REQUIERE
CONFIRMACIÓN / ❌ NO ENCONTRADO), usando el encabezado `RYVO COMPLETE —
<negocio>` en vez de `RYVO ONBOARDING RESEARCH`, más una sección final
nueva:

```
### INFORMACIÓN QUE NECESITO DEL CLIENTE

1. <pregunta concreta, una por cada ⚠️/❌ que sea crítico o un conflicto>
2. ...
```

Reglas para esa sección:

- Una pregunta por cada dato en ⚠️ (conflicto o dudoso) — nunca resolverlo
  vos.
- Una pregunta por cada dato en ❌ que sea **crítico** (ver Fase E).
- Los ❌ **no críticos** no generan pregunta acá — van solo listados en
  FALTANTES, para que el usuario decida si autoriza seguir sin eso.
- No preguntar por nada que ya quedó ✓ CONFIRMADO.

## Fase E — APPROVAL

Esperar aprobación explícita. No tocar producción antes de eso, sin
excepción.

**Crítico** (bloquea Fase F hasta resolverse, no se puede "continuar
igual" aunque el usuario lo autorice, porque el sitio queda roto o
publica algo falso):
- Nombre del negocio y slug.
- Al menos un servicio con nombre.
- Al menos un local con horario semanal cargado — sin esto no hay ningún
  turno disponible.
- Cualquier dato en **conflicto** (⚠️) que vaya a mostrarse públicamente
  (precio, horario, dirección, teléfono) — no se publica un valor en duda.

**No crítico** (se puede continuar si el usuario lo autoriza explícitamente,
la plataforma tiene un comportamiento razonable sin esto):
- Duración de cada servicio (la plataforma usa 30 min por defecto si no
  se especifica).
- Apariencia personalizada (usa el default cuero+bronce si no se pide
  algo puntual).
- Profesionales, redes secundarias (Facebook/TikTok), fotos más allá del
  mínimo (logo o portada).

Si el usuario responde algo como "sí, hacelo" sin contestar una pregunta
crítica puntual, no avanzar con esa parte — repreguntar antes de tocar
producción. Si responde las preguntas y aprueba, pasar a Fase F con los
valores que dio (no los que estaban en conflicto).

## Fase F — ONBOARDING

Ejecutar `onboarding-mode.md` pasos 3 y 4 (crear negocio, completar
editor) con los datos ya aprobados — el paso 1/2 de ese archivo ya está
cubierto por las Fases A–E de acá, no se repite.

Si durante la ejecución aparece algo que no estaba en el informe aprobado
(un campo que el form pide y no se había contemplado, un dato que no
cierra), parar y preguntar — no asumir ni improvisar solo porque ya se
dio la aprobación general.

## Fase G — QA

Ejecutar `onboarding-mode.md` paso 5 (Verificar) completo, tal cual —
incluye el checklist de desktop/mobile, servicios, horarios, profesionales,
imágenes, apariencia, errores visuales y reservas (con turno de prueba
opcional y cancelación inmediata).

Cerrar informando qué se publicó y qué quedó pendiente (si algo no crítico
se dejó afuera a pedido del usuario, decirlo explícitamente para que no
quede como un olvido).
