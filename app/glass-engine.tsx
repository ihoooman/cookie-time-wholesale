"use client";

import { useLayoutEffect } from "react";

export function GlassEngine() {
  useLayoutEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafari =
      /Safari/i.test(userAgent) &&
      !/(Chrome|Chromium|CriOS|Edg|EdgiOS|OPiOS|Android)/i.test(userAgent);

    document.documentElement.dataset.glassEngine = isSafari ? "safari" : "chromium";
  }, []);

  return null;
}
