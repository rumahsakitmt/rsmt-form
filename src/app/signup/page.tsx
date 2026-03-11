import type { Metadata } from "next";
import { SignupPageClient } from "./signup-page-client";

export const metadata: Metadata = {
  title: "Sign Up | RSMT.DOCX",
  description:
    "Create an account to access the RSMT.DOCX template browser and document workspace.",
};

export default function SignupPage() {
  return <SignupPageClient />;
}
