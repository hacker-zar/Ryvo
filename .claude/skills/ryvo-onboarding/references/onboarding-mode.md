# ONBOARDING MODE — carga en producción

Flujo de carga real sobre la plataforma. Se llega acá con datos ya
reunidos y confirmados — a mano (el cliente los mandó completos) o desde
`research-mode.md` ya aprobados por el usuario. Ver reglas duras
compartidas en `SKILL.md`.

**Alcance de investigación en este modo**: ninguna, salvo un dato puntual
que el usuario pida explícitamente buscar sobre la marcha (ej. "fijate el
horario en su Instagram"). Eso es una consulta acotada a esa única fuente,
no la investigación multi-fuente de `research-mode.md` — si hace falta
más que eso, se corta y se sugiere pasar por RESEARCH MODE o COMPLETE MODE
en vez de improvisar una investigación completa desde acá.

Este archivo también es el que ejecutan `research-mode.md` (paso 9, al
aprobarse el informe) y `complete-mode.md` (Fase F) — no lo dupliques en
otro lado, solo referencialo.

## 1. Recolectar y normalizar los datos

Si venís de **RESEARCH MODE** con un informe ya aprobado: no vuelvas a
preguntar por los datos marcados ✓ CONFIRMADO ni re-investigues nada —
arrancá de ahí. Lo único que falta reunir es lo que quedó ⚠️ o ❌ en el
informe: resolvelo con el usuario (confirmar/corregir) o preguntándole
directamente al cliente, según corresponda.

Si no hubo research mode, el input típico es texto/WhatsApp desordenado +
fotos sueltas (a veces viene más estructurado). Organizar antes de abrir
el navegador:

- **Básicos**: nombre del negocio, slug (proponer uno en minúsculas con
  guiones si no lo dan), descripción corta, dirección, ciudad, WhatsApp,
  teléfono, email, Instagram.
- **Apariencia** (opcional): color primario/secundario. Si no especifican,
  dejar el default cuero+bronce de la plantilla.
- **Servicios**: nombre, precio, duración de cada uno.
- **Locales y horarios**: al menos un local con horario semanal completo
  (por día: abierto/cerrado + desde/hasta). Es el dato más crítico — sin
  esto no hay ningún turno disponible en el sitio público.
- **Profesionales** (opcional): nombre, rol, bio corta, foto. No están
  ligados al flujo de reserva, son solo señal de confianza.
- **Fotos**: logo, imagen de portada (hero), galería. Confirmar las rutas
  locales de los archivos (o, si vienen de research mode, la aprobación
  explícita de cuáles usar) antes de intentar subirlas.

Si falta algo crítico, preguntarle al usuario en vez de asumir.

## 2. Confirmar antes de ejecutar

Resumen corto de todo lo anterior → esperar confirmación explícita.

Si esta confirmación ya ocurrió al aprobar el informe de RESEARCH MODE, no
la repitas — seguí directo al paso 3. Si agregaste o cambiaste algo que no
estaba en ese informe (por ejemplo, datos nuevos que mandó el cliente
después), remarcá solo eso antes de seguir.

## 3. Crear el negocio (rol superadmin)

1. Abrir `https://ryvo-arg.vercel.app/admin` en Claude in Chrome.
2. Si pide login: avisar al usuario y esperar. No tipear la contraseña.
3. "Crear negocio" (`NewBusinessForm` → `adminCreateBusiness`): nombre,
   slug, descripción, colores, whatsapp/instagram, dirección, logo/portada.
   Si el form también crea la cuenta del dueño (`owner_name`/`username`/
   `password`), completar todo menos `password` — parar ahí y que lo tipee
   el usuario.
4. Un negocio creado por superadmin nace ya publicado (`published: true`);
   no pasa por el onboarding self-service de pasos
   (`adminSetOnboardingStep`/`adminPublishBusiness`), eso es para cuando el
   dueño carga su propio negocio.

## 4. Completar el editor del negocio

Entrar a `/admin/negocios/<id>`. Los componentes viven bajo
`src/app/admin/negocios/[id]/` — en este momento se están reorganizando
activamente dentro de un route group `(chrome)/`, así que si un nombre de
archivo no coincide, buscar por responsabilidad (grep del label del campo),
no por path exacto. Orden sugerido:

1. **Información** — nombre, descripción, dirección, ciudad, whatsapp,
   instagram, teléfono, email.
2. **Apariencia** — colores / tipografía (preset cerrado) / estilo de
   botón, solo si el cliente pidió algo puntual.
3. **Locales y horarios** — crear el/los local(es) y cargar el horario
   semanal completo. No dejar esto para el final ni a medias.
4. **Servicios** — uno por uno: nombre, precio, duración.
5. **Profesionales** — si el cliente los pidió.
6. **Galería** — logo, portada, fotos. Usar
   `mcp__claude-in-chrome__file_upload` sobre el `<input type="file">`
   real; no hay forma de pegar una URL a mano.
7. **Cuenta** — solo si el cliente va a manejar su propio panel después;
   el campo contraseña lo completa el usuario, nunca vos.

## 5. Verificar (QA)

Cambiar a Claude Browser (pane sandboxeado, no necesita sesión) — nada de
lo que sigue requiere la sesión admin, es todo público. Checklist:

- **Accesibilidad básica**: `/<slug>` carga sin error, en desktop y en
  mobile (`resize_window`) — el caso de uso principal del sitio es
  reservar desde el celular.
- **Servicios**: los que aparecen en la página coinciden uno a uno con lo
  cargado (nombre, precio, duración) — ni de más ni de menos.
- **Horarios**: el horario mostrado/usado por el wizard coincide con el
  cargado; no quedó ningún día con un horario que no corresponde.
- **Profesionales**: si se cargaron, aparecen con nombre/rol/foto
  correctos; si no se cargaron, la sección simplemente no aparece (no debe
  romper el layout).
- **Imágenes**: logo, portada y galería subieron y se ven — sin roturas de
  imagen ni recortes raros.
- **Apariencia**: colores/tipografía/estilo de botón aplicados como se
  definieron (o el default, si no se pidió nada puntual).
- **Errores visuales**: revisar que no haya overlaps, texto cortado, o
  contraste ilegible entre `primary_color` y el texto sobre ese fondo.
- **Reservas**: abrir el wizard y confirmar que aparecen horarios
  disponibles reales para el horario cargado — no hace falta completar una
  reserva de verdad solo para esto.
  - Si el usuario pide una prueba end-to-end del booking: usar datos de
    contacto obviamente falsos ("Test Ryvo"), completarla, confirmar que
    quedó registrada, y cancelarla inmediatamente después desde
    `/admin/negocios/<id>/turnos` para no ensuciar la agenda real del
    cliente.

Si algo de esta lista falla, no lo des por "detalle menor" — reportalo
antes de cerrar el onboarding como terminado.
