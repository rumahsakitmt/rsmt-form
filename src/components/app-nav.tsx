"use client";

import Link from "next/link";
import { authClient } from "@/server/better-auth/client";

const EMPTY_DOC_TYPES: string[] = [];

interface AppNavProps {
  docTypes?: string[];
  selectedDocType?: string;
  onSelectDocType?: (docType: string) => void;
  activeItem?: "templates" | "documents";
}

export function AppNav({
  docTypes = EMPTY_DOC_TYPES,
  selectedDocType = "",
  onSelectDocType,
  activeItem = "templates",
}: AppNavProps) {
  const { data: session, isPending } = authClient.useSession();

  const handleDocTypeClick = (docType: string) => {
    if (onSelectDocType) {
      onSelectDocType(docType);
    }
  };

  return (
    <>
      <nav className="flex flex-col space-y-5 text-[13px] font-extrabold tracking-wide">
        {docTypes.length > 0 ? (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleDocTypeClick("")}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handleDocTypeClick("")
              }
              className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${
                !selectedDocType ? "text-white" : "text-gray-400"
              }`}
            >
              <span>ALL TEMPLATES</span>
              {!selectedDocType && (
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              )}
            </div>

            {docTypes.map((docType) => (
              <div
                role="button"
                tabIndex={0}
                key={docType}
                onClick={() => handleDocTypeClick(docType)}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  handleDocTypeClick(docType)
                }
                className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${
                  selectedDocType === docType ? "text-white" : "text-gray-400"
                }`}
              >
                <span>DOCUMENT {docType}</span>
                {selectedDocType === docType && (
                  <div className="h-2.5 w-2.5 rounded-full bg-white" />
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            <Link
              href="/"
              className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${
                activeItem === "templates" ? "text-white" : "text-gray-400"
              }`}
            >
              <span>ALL TEMPLATES</span>
              {activeItem === "templates" && (
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              )}
            </Link>
            <div
              className={`flex cursor-pointer items-center justify-between transition-colors hover:text-gray-300 ${
                activeItem === "documents" ? "text-white" : "text-gray-400"
              }`}
            >
              <span>GENERATED DOCUMENTS</span>
              {activeItem === "documents" && (
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              )}
            </div>
          </>
        )}

        <Link
          href="/admin/templates/new"
          className={`flex cursor-pointer items-center justify-between ${
            docTypes.length > 0
              ? "mt-4 border-t border-gray-600 pt-5"
              : "mt-4 border-t border-gray-600 pt-4"
          } text-gray-400 transition-colors hover:text-white`}
        >
          <span>ADD TEMPLATE +</span>
        </Link>
      </nav>

      <div className="space-y-6 text-[11px] font-bold tracking-wider">
        <div className="flex justify-between text-gray-400 uppercase">
          <span className="text-white">SYSTEM</span>
          <span>v2.4</span>
        </div>
        {isPending ? (
          <div className="text-gray-400 uppercase">Loading...</div>
        ) : session ? (
          <div className="flex flex-col gap-2">
            <div className="leading-tight text-gray-400 uppercase">
              LOGGED IN AS
              <br />
              <span className="text-white">
                {session.user.name || session.user.email}
              </span>
            </div>
            <button
              onClick={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/login";
                    },
                  },
                });
              }}
              className="text-left text-[10px] tracking-wider text-gray-400 uppercase transition-colors hover:text-white"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="leading-tight text-gray-400 uppercase">
              NOT LOGGED IN
            </div>
            <Link
              href="/login"
              className="text-[11px] tracking-wider text-white uppercase transition-colors hover:text-gray-300"
            >
              SIGN IN →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
