import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sube el límite del body de Server Actions (default de Next.js: 1MB)
  // para permitir el upload de video del hero (hasta 15MB, ver
  // adminUploadVideo en src/lib/admin/actions.ts). Es un límite global a
  // TODAS las Server Actions de la app, no solo esta — tradeoff aceptado,
  // no hay forma de acotarlo por acción.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage: cualquier proyecto (*.supabase.co), donde se
        // sirven las imágenes subidas desde el panel de administración
        // (logo, portada, galería) vía el bucket público "business-images".
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
