const IMG = {
  hand: { src: "/story/hand.png", alt: "A hand holding a fragrance bottle" },
  sunglasses: { src: "/story/sunglasses.png", alt: "A woman in sunglasses" },
  portrait: { src: "/story/bottle-portrait.png", alt: "A man behind a clear perfume bottle" },
  necklace: { src: "/story/necklace.png", alt: "A gold chain necklace" },
};

const HEADING = "Every Leith Essence fragrance unfolds in time.";
const COPY =
  "From the first impression to the final trace, each note is placed with precision to create a seamless experience on the skin.";
const TAGS_LEFT = ["Soft", "Sensitive", "Elegant"];
const TAGS_RIGHT = ["Fresh", "Clean", "Sophisticated"];

const mono = "font-mono text-[11px] uppercase leading-snug tracking-wider";

function Photo({ img, className }) {
  return (
    <div className={`overflow-hidden bg-line ${className}`}>
      <img
        src={img.src}
        alt={img.alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function Tags({ list, right = false }) {
  return (
    <ul className={`${mono} ${right ? "text-right" : ""}`}>
      {list.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

export default function EditorialStory() {
  return (
    <section aria-labelledby="story-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8 sm:py-24">
      <div className="grid gap-10 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 md:gap-x-6 md:gap-y-12">
        {/* 1. Heading, small photo with text, mood words */}
        <div className="flex flex-col justify-between gap-6 sm:gap-8">
          <h2
            id="story-title"
            className="text-[length:clamp(1.9rem,3vw,3.2rem)] font-extrabold uppercase leading-[0.95] tracking-tight md:ml-[23%]"
          >
            {HEADING}
          </h2>
          <div className="flex items-end gap-4 sm:gap-5">
            <Photo img={IMG.hand} className="aspect-[2/3] w-[34%] shrink-0 sm:w-[32%]" />
            <p className={`${mono} max-w-[16rem]`}>{COPY}</p>
          </div>
          <Tags list={TAGS_LEFT} />
        </div>

        {/* 2. Large photo, words underneath */}
        <div className="flex flex-col gap-3">
          <Photo img={IMG.sunglasses} className="aspect-[24/25]" />
          <Tags list={TAGS_RIGHT} right />
        </div>

        {/* 3. Large photo */}
        <Photo img={IMG.portrait} className="aspect-[24/25]" />

        {/* 4. Small photo, with the paragraph beside it on wider screens */}
        <div className="flex items-end justify-end gap-4 sm:gap-5 md:pb-6">
          <p className={`${mono} hidden max-w-[14rem] text-right sm:block`}>{COPY}</p>
          <Photo img={IMG.necklace} className="aspect-[3/4] w-[42%] shrink-0 sm:w-[28%]" />
        </div>
      </div>
    </section>
  );
}