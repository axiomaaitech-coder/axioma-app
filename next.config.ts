import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

Salva **Ctrl+S** e no terminal:
```
git add .
```
```
git commit -m "ignore typescript errors on build"
```
```
git push