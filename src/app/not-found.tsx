import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <main
      id="main-content"
      data-nav-tone="navy"
      className="flex min-h-svh flex-1 flex-col items-center justify-center gap-8 bg-brand-navy px-5 text-center text-brand-white"
    >
      <p className="font-mono text-xs tracking-[0.3em] text-brand-soft-blue">404</p>
      <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em]">
        Page not found
      </h1>
      <ButtonLink href="/" arrow>
        Back to home
      </ButtonLink>
    </main>
  );
}
