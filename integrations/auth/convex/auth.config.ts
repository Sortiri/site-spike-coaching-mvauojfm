/**
 * Convex Auth provider configuration (installed with the "auth" catalog
 * entry). CONVEX_SITE_URL is set automatically on the deployment.
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
