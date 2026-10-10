
import Navbar from "../context/Navbar.jsx";


const STORY =
  "Leith Essence began with three friends who shared one obsession: perfume. What started as late-night conversations about scent notes, favorite fragrances, and the perfect signature scent turned into a shared dream of creating something of our own. Today, we bring that same passion to every bottle we offer, curating fragrances that help you express who you are and leave a lasting impression. At Leith Essence, we believe a scent is more than something you wear. It's a memory, a mood, and a story, and we're here to help you find yours.";

// Fill in instagram (handle without @) and website (like "yourname.com") to show the icons
const OWNERS = [
  {
    name: "Lei Agliam", photo: "/about/lei.png", texture: "/about/texture-1.png",
    bio: "Lei is the creative force behind our online presence, running all things social media at Leith Essence. Favorite scent: Rifaqat.",
    fun: "Lei is always open to new social media management opportunities, so don't be surprised if our content keeps getting better!",
    instagram: "", website: "",
  },
  {
    name: "Joreson Biag", photo: "/about/joreson.png", texture: "/about/texture-2.png",
    bio: "Joreson builds and maintains everything behind the scenes, from our website to future systems that keep the business running smoothly. Favorite scent: Supremacy.",
    fun: "Joreson is also open to web development opportunities, bringing the same passion for clean, reliable work to every project.",
    instagram: "", website: "",
  },
  {
    name: "Von Escano", photo: "/about/von.png", texture: "/about/texture-3.png",
    bio: "Von is the nose behind every bottle, crafting and perfecting each scent in our collection.",
    fun: "When he's not blending fragrances, Von is preparing for his future as a Marine, and he already gets around in his own Starex van.",
    instagram: "", website: "",
  },
];

// On desktop each row mixes the photo, text, and texture in a different order (like your mockup)
const ROW_ORDER = [["photo", "text", "texture"], ["texture", "photo", "text"], ["photo", "text", "texture"]];
const MD_ORDER = ["md:order-1", "md:order-2", "md:order-3"];

export default function About() {
  return (<><Navbar />
    <div className="mx-auto max-w-[1100px] px-4 pb-20 pt-6 sm:px-6">
      <section className="grid overflow-hidden bg-panel md:grid-cols-[1fr_1.1fr]">
        <div className="relative min-h-52 bg-fg/80">
          <img src="/about/story.png" alt="" className="absolute inset-0 h-full w-full object-cover grayscale" />
        </div>
        <p className="flex items-center p-6 text-justify text-xs leading-relaxed text-muted sm:p-10 sm:text-[13px]">{STORY}</p>
      </section>

      <h2 className="display-title mt-14 text-center text-3xl sm:text-5xl">Behind the brands</h2>

      <div className="mt-8">
        {OWNERS.map((o, row) => (
          <article key={o.name} className="grid md:grid-cols-3">
            {ROW_ORDER[row].map((cell, pos) => {
              const order = MD_ORDER[pos];
              if (cell === "photo")
                return <img key={cell} src={o.photo} alt={o.name} className={`order-1 aspect-square w-full bg-panel object-cover grayscale ${order}`} />;
              if (cell === "texture")
                return <img key={cell} src={o.texture} alt="" className={`order-3 hidden aspect-square w-full bg-panel object-cover md:block ${order}`} />;
              return (
                <div key={cell} className={`order-2 flex aspect-auto flex-col justify-center px-6 py-8 text-center md:aspect-square md:px-8 ${order}`}>
                  <h3 className="text-sm font-semibold uppercase">{o.name}</h3>
                  <p className="mt-4 text-justify text-[11px] leading-relaxed">{o.bio}</p>
                  <p className="mt-3 text-justify text-[11px] leading-relaxed"><b>Fun fact:</b> {o.fun}</p>
                  {(o.instagram || o.website) && (
                    <div className="mt-4 flex justify-center gap-6 border-t border-line pt-3 text-[10px] font-semibold">
                      {o.instagram && <a href={`https://instagram.com/${o.instagram}`} target="_blank" rel="noreferrer" className="hover:underline">@{o.instagram}</a>}
                      {o.website && <a href={`https://${o.website}`} target="_blank" rel="noreferrer" className="hover:underline">{o.website}</a>}
                    </div>
                  )}
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </div>
    </>
  );
}