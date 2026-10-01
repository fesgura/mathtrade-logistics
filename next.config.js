const { withSentryConfig } = require("@sentry/nextjs/config");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

// Sentry (src/instrumentation*.ts). No source map upload for now: it needs a
// Sentry auth token in the build.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
});
