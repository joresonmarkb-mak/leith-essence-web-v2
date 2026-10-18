import LegalPage from "../components/LegalPage.jsx";
import { LEGAL } from "../lib/legal.js";

const sections = [
  {
    id: "what",
    title: "What this covers",
    body: [
      `This policy explains how ${LEGAL.brand} uses cookies and similar technologies on our website. Cookies are small files a website saves in your browser. Our site mostly uses a close relative called local storage, which works in the same way for this purpose.`,
    ],
  },
  {
    id: "use",
    title: "What we use",
    body: [
      "We only use storage that the site needs in order to work:",
      {
        list: [
          "Login session (local storage, key: le_token): keeps you logged in as you move between pages. It is removed when you log out, and the login itself expires after 7 days.",
          "Display choice (local storage): remembers whether you picked light or dark mode. It stays until you clear your browser data.",
        ],
      },
      "These do not track you across other websites.",
    ],
  },
  {
    id: "third",
    title: "Third parties",
    body: [
      "A few services outside our site may be used when you visit it. They can set their own cookies or record your IP address, under their own policies:",
      {
        list: [
          "Google: when you open the Login or Register page, Google's sign-in button loads from Google.",
          "Cloudinary: our product images are delivered from Cloudinary's servers.",
          "Our hosting and network provider: it may use security cookies to protect the site from attacks and bots.",
        ],
      },
    ],
  },
  {
    id: "none",
    title: "What we do not use",
    body: [
      "We do not currently use advertising cookies, social media trackers or analytics cookies. If we add any in the future, we will update this policy first and ask for your consent where the law requires it.",
    ],
  },
  {
    id: "manage",
    title: "Managing cookies",
    body: [
      "You can delete or block cookies and site data in your browser's settings. If you block this storage, you will not be able to stay logged in, and the site will forget your light or dark mode. Clearing site data for our website will also log you out.",
    ],
  },
  {
    id: "changes",
    title: "Changes",
    body: [
      "We may update this policy if we change how we use cookies. The date at the top shows when it last changed.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: [
      `Questions about cookies? Email ${LEGAL.email}. For how we handle personal information more broadly, read our Privacy Policy.`,
    ],
  },
];

export default function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="Here is a plain explanation of what our website stores in your browser, and why."
      sections={sections}
    />
  );
}