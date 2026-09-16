export function IconeClubes({ ativo = false }: { ativo?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.6}
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" strokeLinejoin="round" />
      <path d="M12 4v16" strokeLinecap="round" />
      <path d="M8 8v8" strokeLinecap="round" />
    </svg>
  );
}

export function IconeLeituras({ ativo = false }: { ativo?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.6}
      aria-hidden="true"
    >
      <path d="M4 5.5c2-1 5-1 8 .5V20c-3-1.5-6-1.5-8-.5v-14z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 5.5c-2-1-5-1-8 .5V20c3-1.5 6-1.5 8-.5v-14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconePerfil({ ativo = false }: { ativo?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ativo ? 2 : 1.6}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-3.4 4-5.2 7-5.2s5.8 1.8 7 5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Marca do app: quadrado arredondado cor de tijolo com um quadradinho claro no centro.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
        <span className="h-3 w-3 rounded-[3px] bg-cream-50" />
      </span>
      <span className="font-serif text-lg text-ink-900">
        clube <em className="italic">do livro</em>
      </span>
    </span>
  );
}
