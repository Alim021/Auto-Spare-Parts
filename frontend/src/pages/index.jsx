"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /home on app start
    router.push("/home");
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px", fontSize: "18px" }}>
      Redirecting to Home...
    </div>
  );
}
