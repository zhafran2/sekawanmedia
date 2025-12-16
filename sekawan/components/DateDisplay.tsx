"use client";

import { useEffect, useState } from "react";

export function DateDisplay({ isoString }: { isoString: string }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    setFormatted(new Date(isoString).toLocaleString("id-ID"));
  }, [isoString]);

  return <span suppressHydrationWarning>{formatted || isoString}</span>;
}

