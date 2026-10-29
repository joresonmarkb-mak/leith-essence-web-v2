import { useState } from "react";
import { api } from "../lib/api.js";

const HEADING = "Join the Leith community for exclusive access";
const COPY =
  "Be the first to know about our latest arrivals, exclusive offers, and style tips. Join our fragrance community.";

// Same look as your other main buttons. If dark mode doesn't flip it, copy the
// classes from the button in your quiz banner.
const BTN =
  "min-h-12 shrink-0 bg-black px-4 font-mono text-[11px] uppercase tracking-wider text-white dark:bg-white dark:text-black disabled:opacity-60 sm:px-6";

export default function Community() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, msg: "", ok: false });

  async function submit(e) {
    e.preventDefault();
    if (state.busy) return;
    setState({ busy: true, msg: "", ok: false });
    try {
      await api("/subscribers", { method: "POST", body: { email } });
      setEmail("");
      setState({ busy: false, ok: true, msg: "You're in. Welcome to the community." });
    } catch (err) {
      setState({ busy: false, ok: false, msg: err.message || "Something went wrong. Please try again." });
    }
  }

  return (
      <section aria-labelledby="community-title" className="bg-line/50">
        <div className="mx-auto grid min-h-[17rem] max-w-[1400px] grid-cols-[36%_1fr] sm:min-h-[20rem] sm:grid-cols-[34%_1fr] lg:min-h-[26rem] lg:grid-cols-[38%_1fr]">
          {/* Image: absolutely filled so its height always follows the text column */}
          <div className="relative overflow-hidden">
            <img
              src="/community/bottle.png"
              alt="A Leith Essence perfume bottle"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-left"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-center px-3 py-6 sm:px-8 sm:py-12 lg:px-16">
            <h2
              id="community-title"
              className="text-[length:clamp(0.95rem,5vw,1.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-[length:clamp(1.15rem,3.4vw,1.9rem)] lg:text-[length:clamp(2rem,3.4vw,3rem)]
                lg:[-webkit-mask-image:linear-gradient(90deg,#000_45%,rgba(0,0,0,.55))]
                lg:[mask-image:linear-gradient(90deg,#000_45%,rgba(0,0,0,.55))]"
            >
              {HEADING}
            </h2>

            <p className="mt-2 max-w-sm font-mono text-[9px] uppercase leading-relaxed tracking-wide sm:mt-5 sm:text-[11px] sm:tracking-wider">
              {COPY}
            </p>

            <form onSubmit={submit} className="mt-4 flex w-full max-w-lg flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-0">
              <label htmlFor="community-email" className="sr-only">Email address</label>
              <input
                id="community-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR EMAIL"
                className="min-h-11 w-full min-w-0 border-0 bg-white px-3 font-mono text-base text-black placeholder:text-[10px] placeholder:uppercase placeholder:tracking-wider placeholder:text-neutral-500 focus:outline-2 focus:outline-offset-2 focus:outline-current sm:min-h-12 sm:px-4 sm:placeholder:text-[11px]"
              />
              <button
                type="submit"
                disabled={state.busy}
                className={`${BTN} min-h-11 w-full sm:min-h-12 sm:w-auto`}
              >
                {state.busy ? "Please wait" : "Subscribe"}
              </button>
            </form>

            <p role="status" className={`mt-2 min-h-4 font-mono text-[10px] sm:mt-3 sm:min-h-5 sm:text-[11px] ${state.ok ? "" : "text-red-500"}`}>
              {state.msg}
            </p>
          </div>
        </div>
      </section>
  );
}