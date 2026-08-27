"use client";

import Image from "next/image";
import {
  AcademyCategoryWithRelations,
  Academy as AcademyType,
  Location,
  Professional,
  TemplateLayoutId,
} from "@/types/business";
import { dayLabel, readableTextColor } from "@/lib/format";
import { useAcademyInterestModal } from "@/lib/academy-interest-modal-context";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import Icon from "@/components/ui/Icon";

interface AcademyProps {
  academy: AcademyType | null;
  categories: AcademyCategoryWithRelations[];
  professionals: Professional[];
  locations: Location[];
  gallery: string[];
  primaryColor: string;
  layout?: TemplateLayoutId;
}

function daysSummary(days: string[]): string {
  if (days.length === 0) return "";
  return days.map((d) => dayLabel(d)).join(" y ");
}

/**
 * Academia — sección nativa reutilizable de RYVO (ver plan: nada acá
 * depende de qué negocio es, todo sale de `academy`/`categories`).
 *
 * Un solo tratamiento visual, sin ramas por `layout` como Services.tsx —
 * a propósito: Academia no necesita 5 variantes estructurales para
 * sentirse parte del sitio, `SectionHeader` ya adapta la tipografía por
 * plantilla (título grande en editorial/bold), y el resto reutiliza las
 * mismas clases (`image-frame`, `radius-sm`, `border-ink-line`,
 * `ticket-number`) que el resto de las secciones.
 */
export default function Academy({
  academy,
  categories,
  professionals,
  locations,
  gallery,
  primaryColor,
  layout,
}: AcademyProps) {
  const { openFor } = useAcademyInterestModal();

  if (!academy?.enabled) return null;

  const ctaTextColor = readableTextColor(primaryColor);
  const ctaLabel = academy.cta_text?.trim() || "Quiero inscribirme";

  const cta = (
    <button
      type="button"
      onClick={() => openFor({})}
      className="section-eyebrow text-xs px-7 py-3.5 btn-radius font-semibold hover:opacity-90 transition-opacity"
      style={{ backgroundColor: primaryColor, color: ctaTextColor }}
    >
      {ctaLabel}
    </button>
  );

  // Profesores/sedes referenciados de verdad por alguna categoría activa
  // — no la sección Profesionales/Sedes entera (esa ya tiene su propio
  // lugar en la página si el negocio la activó); acá solo lo relevante
  // para Academia.
  const referencedInstructorIds = new Set(
    categories.map((c) => c.instructor_id).filter((id): id is string => Boolean(id))
  );
  const referencedLocationIds = new Set(
    categories.map((c) => c.location_id).filter((id): id is string => Boolean(id))
  );
  const instructors = professionals.filter((p) => referencedInstructorIds.has(p.id));
  const academyLocations = locations.filter((l) => referencedLocationIds.has(l.id));
  const galleryPreview = gallery.slice(0, 6);

  return (
    <section id="academia" className="mx-auto max-w-5xl px-4 section-y">
      {/* Hero interno */}
      <Reveal className="grid gap-8 md:grid-cols-[1fr_minmax(0,380px)] md:items-center">
        <div>
          <p className="section-eyebrow" style={{ color: primaryColor }}>
            {academy.activity_type || "Academia"}
          </p>
          <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
            {academy.name || "Academia"}
          </h2>
          {academy.headline ? (
            <p className="mt-3 text-lg text-bone-muted">{academy.headline}</p>
          ) : null}
          {academy.description ? (
            <p className="mt-4 max-w-xl text-sm md:text-base text-bone-muted leading-relaxed">
              {academy.description}
            </p>
          ) : null}
          <div className="mt-8">{cta}</div>
        </div>
        {academy.image ? (
          <div className="image-frame relative aspect-[4/3] overflow-hidden bg-ink-elevated">
            <Image src={academy.image} alt={academy.name} fill className="object-cover" />
          </div>
        ) : null}
      </Reveal>

      {/* Categorías */}
      {categories.length > 0 ? (
        <div className="mt-16">
          <SectionHeader eyebrow="Categorías" title="Elegí tu grupo" primaryColor={primaryColor} layout={layout} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {categories.map((category, i) => (
              <Reveal key={category.id} delay={100 + Math.min(i, 5) * 60}>
                <div className="radius-sm border border-ink-line p-6 h-full flex flex-col">
                  <h3 className="display-title text-xl text-bone">{category.name}</h3>
                  {category.age_level ? (
                    <p className="mt-1 text-xs text-bone-muted">{category.age_level}</p>
                  ) : null}
                  {category.description ? (
                    <p className="mt-3 text-sm text-bone-muted leading-relaxed">
                      {category.description}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-1.5 text-xs text-bone-muted">
                    {category.days.length > 0 || category.schedule_time ? (
                      <span className="flex items-center gap-1.5">
                        <Icon name="calendar" size={16} className="shrink-0" />
                        {[daysSummary(category.days), category.schedule_time]
                          .filter(Boolean)
                          .join(" — ")}
                      </span>
                    ) : null}
                    {category.location_name ? (
                      <span className="flex items-center gap-1.5">
                        <Icon name="pin" size={16} className="shrink-0" />
                        {category.location_name}
                      </span>
                    ) : null}
                    {category.instructor_name ? (
                      <span>Profesor: {category.instructor_name}</span>
                    ) : null}
                    {category.capacity != null ? (
                      <span className="ticket-number" style={{ color: primaryColor }}>
                        {category.capacity} cupos
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => openFor({ categoryId: category.id })}
                    className="mt-6 section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors w-fit"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    Me interesa
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      ) : null}

      {/* Profesores */}
      {instructors.length > 0 ? (
        <Reveal className="mt-16">
          <p className="section-eyebrow text-bone-muted mb-4">Profesores</p>
          <div className="flex flex-wrap gap-4">
            {instructors.map((instructor) => (
              <div key={instructor.id} className="flex items-center gap-3">
                <div className="image-frame relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-ink-elevated">
                  {instructor.photo ? (
                    <Image
                      src={instructor.photo}
                      alt={instructor.name}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <span className="text-sm text-bone">{instructor.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}

      {/* Sedes */}
      {academyLocations.length > 0 ? (
        <Reveal className="mt-10">
          <p className="section-eyebrow text-bone-muted mb-4">Sedes</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {academyLocations.map((location) => (
              <div key={location.id} className="text-sm text-bone-muted">
                <span className="text-bone">{location.name}</span>
                {location.address ? ` — ${location.address}` : ""}
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}

      {/* Galería (reutiliza business.gallery, sin subida propia) */}
      {galleryPreview.length > 0 ? (
        <Reveal className="mt-10">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {galleryPreview.map((src, i) => (
              <div key={i} className="image-frame relative aspect-square overflow-hidden bg-ink-elevated">
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
