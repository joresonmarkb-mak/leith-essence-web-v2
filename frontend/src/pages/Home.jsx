import { Link } from "react-router-dom";
import { ArrowCircle } from "../components/Icons.jsx";
import TopChoices from "../components/TopChoices.jsx";
import EditorialStory from "../components/EditorialStory.jsx";
import Impressions from "../components/Impressions.jsx";
import Community from "../components/Community.jsx";
import Footer from "../components/Footer.jsx";
import BottleSpecs from "../components/BottleSpecs.jsx";


export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-[1840px] px-4 pb-8 pt-8 sm:px-[3.5%]" style={{ "--s": "min(26vw, 380px)" }}>
        <div className="relative z-10 mx-[2%] overflow-hidden bg-panel sm:mx-[8%] "id="home">
          <img src="/hero.png" alt="Leith Essence Extrait de Parfum" className="aspect-[4/3] w-full object-cover sm:aspect-[679/410]" />

          <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-[11px] uppercase tracking-wide text-white sm:bottom-8 sm:left-8 sm:text-xs">
            <Link to="/shop" className="flex items-center gap-2 hover:opacity-70">Explore collection <ArrowCircle /></Link>
            <Link to="/shop" className="flex items-center gap-2 hover:opacity-70">Order now <ArrowCircle /></Link>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative z-0 flex select-none justify-between font-black text-fg"
          style={{ fontSize: "var(--s)", lineHeight: 0.72, marginTop: "calc(var(--s) * -0.52)" }}
        >
          <span>L</span><span>E</span><span>I</span><span>T</span><span>H</span>
        </div>
      </section>

      <section id="quiz" className="grid scroll-mt-14 grid-cols-[3fr_2fr] md:grid-cols-2">
        <div className="flex flex-col justify-center bg-panel px-4 py-8 sm:px-12 md:py-20">
          <h2 className="text-base font-semibold uppercase leading-tight tracking-tight sm:text-2xl md:text-3xl">
            Take our quiz and<br className="hidden sm:block" /> build your scent profile
          </h2>
          <p className="mt-3 max-w-md text-[10px] font-medium uppercase leading-relaxed sm:mt-5 sm:text-xs md:mt-6">
            Tell us all about the scents you love, we'll recommend options that fit your preferences,
            and re-take the quiz any time your mood changes.
          </p>
          <Link
            to="/quiz"
            className="mt-5 inline-flex min-h-10 w-fit items-center justify-center bg-accent px-4 text-[10px] font-semibold uppercase text-accent-fg transition hover:opacity-85 sm:mt-6 sm:min-h-11 sm:px-6 sm:text-[11px]"
          >
            Start the quiz
          </Link>
        </div>
        <img
          src="/quiz-banner.png"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full min-h-[220px] w-full object-cover md:min-h-[420px]"
        />
      </section>
      <TopChoices />
      <EditorialStory />
      <BottleSpecs />
      <Impressions />
      <Community />
      <Footer />
    </>
  );
}