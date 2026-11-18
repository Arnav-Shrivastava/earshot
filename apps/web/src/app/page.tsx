import { Ear } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <Ear aria-hidden="true" className="size-8 text-accent" />
      <h1 className="text-[28px] leading-9">Earshot</h1>
      <p className="text-ink-muted">
        Collect user feedback from everywhere, group it into issues, and decide what to build next.
        Setup is coming soon.
      </p>
      <div>
        <Button>Get started</Button>
      </div>
    </main>
  );
}
