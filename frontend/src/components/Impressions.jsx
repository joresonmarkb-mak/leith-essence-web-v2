const HEADING = "Beyond first impressions";
const SUB = "Not just noticed in the moment—but remembered long after.";

const REVIEWS = [
  {
    quote: "The dry down is where it truly wins.",
    body: "What starts as something subtle evolves into something deeper, warmer, and more personal. It stays—even when everything else fades.",
    name: "Joseph",
  },
  {
    quote: "It doesn't try too hard—and that's why it stands out.",
    body: "A scent that sits close, yet leaves a trail people notice without asking. It becomes part of your presence, not just an accessory.",
    name: "Mary",
  },
  {
    quote: "People don't ask what I'm wearing—they remember it.",
    body: "There's a quiet confidence in how it projects. Not loud, not overpowering—just enough to leave a mark.",
    name: "Jhayr",
  },
  {
    quote: "It feels like it was made for me.",
    body: "Balanced, smooth, and effortless. A fragrance that adapts to you and becomes uniquely yours over time.",
    name: "Von",
  },
];

export default function Impressions() {
  return (
    <section aria-labelledby="impressions-title" className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 sm:py-24">
      <header className="mb-10 text-center sm:mb-14">
        <h2
          id="impressions-title"
          className="text-[length:clamp(1.6rem,4vw,2.6rem)] font-extrabold uppercase leading-none tracking-tight"
        >
          {HEADING}
        </h2>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider sm:text-[11px]">{SUB}</p>
      </header>

      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
        {REVIEWS.map((r) => (
          <li key={r.name} className="flex">
            <figure className="flex min-h-[18rem] flex-1 flex-col justify-between gap-10 bg-surface p-4 font-mono uppercase sm:p-5 lg:min-h-[21rem]">
              <blockquote className="text-[15px] font-bold leading-tight sm:text-base lg:text-[clamp(0.8rem,1.35vw,1.1rem)]">
                “{r.quote}”
              </blockquote>
              <figcaption className="ml-auto max-w-[16rem] text-right">
                <p className="text-[10px] leading-snug tracking-wide sm:text-[11px]">{r.body}</p>
                <p className="mt-4 text-[10px] sm:text-[11px]">-{r.name}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}