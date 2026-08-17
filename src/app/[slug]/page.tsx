import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/data/business-repository";
import BusinessSite from "@/components/BusinessSite";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);
  if (!profile) return {};

  return {
    title: profile.business.name,
    description: profile.business.description,
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);

  if (!profile) notFound();

  return <BusinessSite profile={profile} slug={slug} />;
}
