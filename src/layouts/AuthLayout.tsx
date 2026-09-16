import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({
  children,
  voltarPara,
}: {
  children: ReactNode;
  voltarPara?: string;
}) {
  return (
    <div className="flex min-h-screen w-full justify-center bg-cream-100 px-5 py-8">
      <div className="flex w-full max-w-sm flex-col">
        {voltarPara && (
          <Link
            to={voltarPara}
            className="mb-4 inline-flex w-fit items-center gap-1 text-sm text-muted-600 hover:text-ink-800"
          >
            ← voltar
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
