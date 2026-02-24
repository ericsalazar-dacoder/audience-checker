"use client";

import { useEffect, useState } from "react";
import QueryCheckerApp from "./QueryCheckerApp";

export default function QueryCheckerWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <QueryCheckerApp />;
}
