import type { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Login | RSMT.DOCX",
  description:
    "Sign in to access the RSMT.DOCX template browser and document workspace.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
