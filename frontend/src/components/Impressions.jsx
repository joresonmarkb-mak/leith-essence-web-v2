const HEADING = "Beyond first impressions";
const SUB = "Not just noticed in the moment—but remembered long after.";

// type "quote" = text card, type "photo" = image card. Order = reading order.
const CARDS = [
  {
    type: "quote",
    quote: "The dry down is where it truly wins.",
    body: "What starts as something subtle evolves into something deeper, warmer, and more personal. It stays—even when everything else fades.",
    name: "Joseph",
  },
  { type: "photo", src: "/impressions/ember.png", alt: "Dark texture with a glowing orange edge" },
  {
    type: "quote",
    quote: "People don't ask what I'm wearing—they remember it.",
    body: "There's a quiet confidence in how it projects. Not loud, not overpowering—just enough to leave a mark.",
    name: "Jhayr",
  },
  {
    type: "quote",
    quote: "It feels like it was made for me.",
    body: "Balanced, smooth, and effortless. A fragrance that adapts to you and becomes uniquely yours over time.",
    name: "Von",
  },
  { type: "photo", src: "/impressions/swirl.png", alt: "Brown swirling lines" },
  {
    type: "quote",
    quote: "It doesn't try too hard—and that's why it stands out.",
    body: "A scent that sits close, yet leaves a trail people notice without asking. It becomes part of your presence, not just an accessory.",
    name: "Mary",
  },
  { type: "photo", src: "/impressions/concrete.png", alt: "Grey curved concrete wall" },
  { type: "photo", src: "/impressions/glow.png", alt: "Red and pink light glow" },
];

function QuoteCard({ c }) {
  return (
    <figure className="flex min-h-[15rem] flex-col justify-between gap-6 p-3 font-mono uppercase sm:p-4 md:aspect-[3/4] md:min-h-0">
      <blockquote className="text-[13px] font-bold leading-tight sm:text-sm md:text-[clamp(0.75rem,1.25vw,1.1rem)]">
        “{c.quote}”
      </blockquote>
      <figcaption className="ml-auto text-right">
        <p className="text-[10px] leading-snug tracking-wide md:text-[clamp(0.625rem,0.8vw,0.75rem)]">
          {c.body}
        </p>
        <p className="mt-4 text-[10px] md:text-[11px]">-{c.name}</p>
      </figcaption>
    </figure>
  );
}

function PhotoCard({ c }) {
  return (
    <div className="min-h-[15rem] overflow-hidden bg-line md:aspect-[3/4] md:min-h-0">
      <img src={c.src} alt={c.alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

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

      <div className="grid grid-cols-2 gap-1 md:grid-cols-4 md:gap-1.5">
        {CARDS.map((c, i) =>
          c.type === "quote" ? <QuoteCard key={i} c={c} /> : <PhotoCard key={i} c={c} />
        )}
      </div>
    </section>
  );
}