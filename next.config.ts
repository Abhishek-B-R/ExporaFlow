import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/workflow/project/:projectId/issues/:ticketId",
        destination: "/workflow/project/:projectId/incident-tickets/:ticketId",
        permanent: false,
      },
      {
        source: "/workflow/project/:projectId/issues",
        destination: "/workflow/project/:projectId/incident-tickets",
        permanent: false,
      },
      {
        source: "/workflow/customers",
        destination: "/workflow/store/customers",
        permanent: false,
      },
      {
        source: "/workflow/employees",
        destination: "/workflow/store/employees",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
