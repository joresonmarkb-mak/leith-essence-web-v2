import Navbar from "../context/Navbar.jsx";
import Footer from "../components/Footer.jsx";

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

// Desktop (lg+) order of the 3 cells in each row, like your mockup.
// Below lg, photo + texture sit side by side in this same left/right order and the text drops underneath.
const ROW_ORDER = [
  ["photo", "text", "texture"],
  ["texture", "photo", "text"],
  ["photo", "text", "texture"],
];

// url is optional. If you add one, the logo becomes a link.
const FRIENDS = [
  { name: "Aeonix", logo: "/about/friends/aeonix.png", url: "https://www.facebook.com/profile.php?id=61569961003531" },
  { name: "FACX Collectibles and Accessories", logo: "/about/friends/facx.png", url: "https://www.facebook.com/profile.php?id=61584773513917" },
  { name: "Salin Scents", logo: "/about/friends/salin-scents.png", url: "https://www.facebook.com/profile.php?id=61587798867789" },
  { name: "BHND", logo: "/about/friends/bhnd.png", url: "https://bhndthework.com/" },
  { name: "Mac V1", logo: "/about/friends/mac-v1.png", url: "https://www.facebook.com/profile.php?id=100094973907393" },
];

export default function About() {
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
        {/* Story */}
        <section className="grid overflow-hidden bg-panel md:grid-cols-[1fr_1.1fr]">
          <div className="relative min-h-52 bg-fg/80 sm:min-h-64 md:min-h-0">
            <img
              src="/about/story.png"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
          </div>
          <p className="flex items-center p-6 text-left text-[13px] leading-relaxed text-muted sm:p-10 sm:text-justify">
            {STORY}
          </p>
        </section>

        <h2 className="display-title mt-12 text-balance text-center text-3xl sm:mt-14 sm:text-5xl">
          Behind the brands
        </h2>

        {/* Owners */}
        <div className="mt-8 flex flex-col gap-10 lg:gap-0">
{OWNERS.map((o, row) => {
  const flip = row % 2 === 1; // odd rows swap sides on phone/tablet

  return (
    <article key={o.name} className="grid grid-cols-2 lg:grid-cols-3">
      {ROW_ORDER[row % ROW_ORDER.length].map((cell) => {
        if (cell === "photo")
          return (
            <img
              key={cell}
              src={o.photo}
              alt={o.name}
              loading="lazy"
              decoding="async"
              className={`aspect-square w-full bg-panel object-cover grayscale lg:order-none ${
                flip ? "order-2" : "order-1"
              }`}
            />
          );

        if (cell === "texture")
          return (
            <img
              key={cell}
              src={o.texture}
              alt=""
              loading="lazy"
              decoding="async"
              className={`aspect-square w-full bg-panel object-cover lg:order-none ${
                flip ? "order-1" : "order-2"
              }`}
            />
          );

        return (
          <div
            key={cell}
            className="order-3 col-span-2 flex flex-col justify-center px-5 py-8 text-center sm:px-8 lg:order-none lg:col-span-1 lg:aspect-square"
          >
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <h3 className="text-base font-semibold uppercase lg:text-sm">{o.name}</h3>
              <p className="mt-4 text-left text-xs leading-relaxed lg:text-justify lg:text-[11px]">
                {o.bio}
              </p>
              <p className="mt-3 text-left text-xs leading-relaxed lg:text-justify lg:text-[11px]">
                <b>Fun fact:</b> {o.fun}
              </p>
              {(o.instagram || o.website) && (
                <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 border-t border-line pt-3 text-[11px] font-semibold lg:text-[10px]">
                  {o.instagram && (
                    <a href={`https://instagram.com/${o.instagram}`} target="_blank" rel="noreferrer" className="py-1 hover:underline">
                      @{o.instagram}
                    </a>
                  )}
                  {o.website && (
                    <a href={`https://${o.website}`} target="_blank" rel="noreferrer" className="py-1 hover:underline">
                      {o.website}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </article>
  );
})}
        </div>
      </div>
       <section aria-labelledby="friends-title" className="mt-16 text-center sm:mt-24 my-10">
      <h2
        id="friends-title"
        className="display-title bg-gradient-to-r from-fg from-60% to-muted bg-clip-text text-balance text-3xl text-transparent sm:text-5xl"
      >
        Support our friends
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-balance text-[11px] leading-relaxed text-muted sm:mt-4 sm:text-xs">
        Beyond affordable perfumes with a luxury feel, Leith Essence stands with small
        businesses. Take a moment to check out these five.
      </p>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-8 sm:mt-10 sm:gap-x-6 lg:flex-nowrap lg:gap-x-8">
        {FRIENDS.map((f) => {
          const logo = (
          <img
            src={f.logo}
            alt={f.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain mix-blend-multiply "
          />
          );

          return (
            <li key={f.name} className="flex h-20 w-[42%] items-center justify-center sm:h-24 sm:w-[30%] lg:w-[18%]">
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={f.name}
                  className="block h-full w-full"
                >
                  {logo}
                </a>
              ) : (
                logo
              )}
            </li>
          );
        })}
      </ul>
    </section>
      <Footer />
    </>
  );
}