import { Link } from "react-router-dom";
import { ArrowCircle } from "../components/Icons.jsx";

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-4 pb-8 pt-8 sm:px-[3.5%]" style={{ "--s": "min(26vw, 380px)" }}>
        <div className="relative z-10 mx-[2%] overflow-hidden bg-panel sm:mx-[8%]">
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

      <section className="grid md:grid-cols-2">
        <div className="flex flex-col justify-center bg-panel px-6 py-14 sm:px-12 md:py-20">
          <h2 className="text-2xl font-semibold uppercase leading-tight tracking-tight sm:text-3xl">
            Take our quiz and<br />build your scent profile
          </h2>
          <p className="mt-6 max-w-md text-xs font-medium uppercase leading-relaxed">
            Tell us all about the scents you love, we'll recommend options that fit your preferences,
            and re-take the quiz any time your mood changes.
          </p>
          <Link to="/quiz" className="mt-6 inline-block w-fit bg-accent px-5 py-2.5 text-[11px] font-semibold uppercase text-accent-fg transition hover:opacity-85">
            Start the quiz
          </Link>
        </div>
        <img src="/quiz-banner.png" alt="" className="h-72 w-full object-cover md:h-full md:min-h-[420px]" />
      </section>
    </>
  );
}