import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
