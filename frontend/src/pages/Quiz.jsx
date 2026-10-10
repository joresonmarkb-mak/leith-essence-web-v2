import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Quiz() {
  const [questions, setQuestions] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    api("/quiz/questions")
      .then((q) => { if (!ignore) setQuestions(q); })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, []);

  async function submit(all) {
    setBusy(true);
    setError("");
    try {
      const r = await api("/quiz/attempts", {
        method: "POST",
        body: { answers: questions.map((q) => ({ questionId: q.id, optionIds: all[q.id] })) },
      });
      setMatches(r.matches);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    setAnswers({});
    setIndex(0);
    setMatches(null);
    setError("");
  }

  if (!questions) {
    return error
      ? <p role="alert" className="p-10 text-center text-danger">{error}</p>
      : <p className="p-10 text-center text-muted">Loading the quiz...</p>;
  }
  if (matches) return <Results matches={matches} onRetake={retake} />;

  const last = questions.length - 1;
  const q = questions[index];
  const picked = answers[q.id] ?? [];
  const multi = q.maxChoices > 1;

  function pickSingle(opt) {
    const next = { ...answers, [q.id]: [opt.id] };
    setAnswers(next);
    if (index === last) submit(next);
    else setIndex(index + 1);
  }
  function toggleMulti(opt) {
    if (picked.includes(opt.id)) setAnswers({ ...answers, [q.id]: picked.filter((x) => x !== opt.id) });
    else if (picked.length < q.maxChoices) setAnswers({ ...answers, [q.id]: [...picked, opt.id] });
  }
  const next = () => (index === last ? submit(answers) : setIndex(index + 1));

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col px-4 pb-16 pt-10 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-widest text-muted">Question {index + 1} of {questions.length}</p>
        <div className="mx-auto mt-3 h-0.5 w-40 bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1}>
          <div className="h-full bg-fg transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <h1 className="mx-auto mt-10 max-w-xl text-center text-xl font-bold uppercase leading-snug sm:text-2xl">{q.text}</h1>
      {multi && <p className="mt-2 text-center text-xs text-muted">Pick up to {q.maxChoices} ({picked.length}/{q.maxChoices} chosen)</p>}

      {multi ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {q.options.map((o) => {
            const on = picked.includes(o.id);
            return (
              <button
                key={o.id} type="button" aria-pressed={on} onClick={() => toggleMulti(o)}
                className={`min-h-11 rounded-lg border px-4 text-sm transition ${
                  on ? "border-fg bg-accent text-accent-fg" : "border-line bg-surface hover:border-muted"
                }`}
              >
                {o.text}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`mx-auto mt-8 grid w-full gap-3 ${q.options.length === 2 ? "max-w-xl sm:grid-cols-2" : "max-w-md"}`}>
          {q.options.map((o) => (
            <button
              key={o.id} type="button" disabled={busy} onClick={() => pickSingle(o)}
              className={`min-h-14 bg-panel px-5 text-left text-sm font-semibold uppercase transition hover:opacity-80 disabled:opacity-60 ${
                picked.includes(o.id) ? "ring-2 ring-fg" : ""
              }`}
            >
              {o.text}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert" className="mt-6 text-center text-sm text-danger">{error}</p>}

      <div className="mt-10 flex items-center justify-between">
        {index > 0 ? (
          <button type="button" onClick={() => setIndex(index - 1)} className="min-h-11 text-[11px] font-medium uppercase tracking-wide text-muted hover:text-fg">&larr; Back</button>
        ) : <span />}
        {(multi || (index === last && error)) && (
          <button
            type="button" disabled={busy || picked.length === 0} onClick={next}
            className="min-h-11 bg-accent px-6 text-[11px] font-semibold uppercase text-accent-fg disabled:opacity-40"
          >
            {busy ? "Finding your match..." : index === last ? "See my match" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}

function Results({ matches, onRetake }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <h1 className="display-title text-center text-5xl sm:text-7xl">Your matches</h1>
      <p className="mt-3 text-center text-xs text-muted">Based on your answers. Retake the quiz any time your mood changes.</p>

      {matches.length === 0 ? (
        <p className="mt-10 text-center text-muted">No perfumes in stock match those answers right now. Try retaking the quiz.</p>
      ) : (
        <ol className="mt-10 flex flex-col gap-4">
          {matches.map((m, i) => (
            <li key={m.id}>
              <Link to={`/perfume/${m.id}`} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 border border-line bg-surface p-4 transition hover:border-fg sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                <div className="grid h-28 place-items-center sm:h-36">
                  {m.imageUrl && <img src={m.imageUrl} alt="" className="max-h-full max-w-full object-contain" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-muted">#{i + 1} match</p>
                  <h2 className="text-lg font-bold uppercase leading-tight sm:text-2xl">{m.name}</h2>
                  {m.inspiredBy && <p className="font-serif text-sm italic text-muted">Character of {m.inspiredBy}</p>}
                  <p className="mt-2 text-2xl font-bold">{m.matchPercent}% <span className="text-xs font-normal uppercase text-muted">match</span></p>
                  {m.matchedNotes.length > 0 && (
                    <p className="mt-1 text-xs text-muted">Notes you picked: {m.matchedNotes.join(", ")}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 flex justify-center gap-3">
        <button type="button" onClick={onRetake} className="min-h-11 border border-fg px-6 text-[11px] font-medium uppercase">Retake the quiz</button>
        <Link to="/shop" className="inline-flex min-h-11 items-center bg-accent px-6 text-[11px] font-semibold uppercase text-accent-fg">Shop all</Link>
      </div>
    </div>
  );
}