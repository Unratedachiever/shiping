import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-line bg-navy text-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-2">{kicker}</p>
        ) : null}
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-paper/70">{description}</p> : null}
      </div>
    </section>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
