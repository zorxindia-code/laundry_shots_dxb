import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { ExperienceOutro } from "@/components/sections/ExperienceOutro";
import { LaundryFrameSequence } from "@/components/sections/LaundryFrameSequence";
import { laundryFrames } from "@/config/video-frames";

const title = "The Shots Experience";
const description =
  "Follow every garment's journey with Shots Laundry — from dirty clothes to deep cleaning, precision ironing, delivery and a fresh, ready-to-wear finish.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/experience" },
  openGraph: { title, description, url: "/experience" },
  twitter: { title, description },
};

export default function ExperiencePage() {
  return (
    <>
      <main className="flex-1">
        {/* The laundry journey video as a scroll-controlled frame sequence, then the closing CTA. */}
        <div id="journey">
          <LaundryFrameSequence />
        </div>
        <ExperienceOutro backgroundColor={laundryFrames.bands[laundryFrames.count - 1].at(-1)?.[1]} />
      </main>
      <Footer variant="minimal" />
    </>
  );
}
