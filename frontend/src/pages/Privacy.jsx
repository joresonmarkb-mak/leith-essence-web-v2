import LegalPage from "../components/LegalPage.jsx";
import { LEGAL } from "../lib/legal.js";

const sections = [
  {
    id: "who",
    title: "Who we are",
    body: [
      `${LEGAL.brand} ("we", "us") sells fragrances online and is run by its co-owners from ${LEGAL.location}. Under the Data Privacy Act of 2012 (Republic Act No. 10173), we are the "personal information controller" for the information described in this policy.`,
      `Questions about your data? Email ${LEGAL.email}.`,
    ],
  },
  {
    id: "collect",
    title: "What we collect",
    body: [
      "We collect only what we need to run the shop:",
      {
        list: [
          "Account details: your name, email address, mobile number, delivery address, and a password. Your password is stored only as a one-way hash, so we cannot read it.",
          "Google sign-in: if you choose it, your name, email address and Google account ID. We never see your Google password.",
          "Orders: the items you buy, prices, any voucher used, your delivery address and the order status.",
          "Payment proof: the GCash receipt image you upload. It may show your name, part of your GCash number, the amount and a reference number. We never see your GCash PIN or login.",
          "Perfume quiz: your answers, so we can recommend scents.",
          "Newsletter: your email address, if you subscribe.",
          "Messages: anything you send us by email or social media.",
          "Technical data: IP address, browser, device and visit times, kept in server logs for security.",
        ],
      },
    ],
  },
  {
    id: "use",
    title: "How we use it",
    body: [
      {
        list: [
          "To create and manage your account and confirm your email address.",
          "To process orders, check GCash payments, pack and deliver your items.",
          "To email you about your account and orders.",
          "To send announcements such as new scents and new stocks (see section 6).",
          "To recommend perfumes from your quiz answers.",
          "To keep the site secure and prevent fraud, fake receipts and abuse.",
          "To keep business, tax and accounting records as the law requires.",
          "To fix problems and improve the site.",
        ],
      },
    ],
  },
  {
    id: "basis",
    title: "Why we may use it",
    body: [
      "We process your information because you gave consent (for example, subscribing to the newsletter or signing in with Google), because we need it to carry out your order, because the law requires us to keep certain records, or because we have a legitimate interest in keeping the shop secure and free from fraud.",
    ],
  },
  {
    id: "share",
    title: "Who we share it with",
    body: [
      "We do not sell your personal information. We share it only with:",
      {
        list: [
          "Delivery partners: your name, phone number and address, so your order can reach you.",
          "Service providers that run the shop for us: cloud hosting and database providers, Cloudinary (image storage), and our email provider. They may only use your data to provide their service to us.",
          "Google, if you use Google sign-in.",
          "The shop's co-owners and staff who handle orders.",
          "Government agencies or other parties when the law requires it.",
        ],
      },
      "Some of these providers store data outside the Philippines. We choose providers that protect data with appropriate safeguards.",
    ],
  },
  {
    id: "marketing",
    title: "Emails and unsubscribing",
    body: [
      "If you subscribed, or you have an account with us, we may email you about new scents, new stocks and offers. Every one of these emails has an Unsubscribe link, and clicking it stops them straight away.",
      "We will still send important emails about your account and orders, such as email confirmation, even if you unsubscribe from announcements.",
    ],
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: [
      {
        list: [
          "Account details: for as long as your account is open.",
          "Orders and payment proof: for as long as Philippine tax, accounting and consumer laws require us to keep business records.",
          "Newsletter email: until you unsubscribe or ask us to delete it. We keep a record that you unsubscribed so we do not email you again.",
          "Email confirmation links: deleted once used or after 24 hours.",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "How we protect it",
    body: [
      "We hash passwords, use encrypted connections (HTTPS), limit admin access to the co-owners, and check every login. No online system is completely secure. If a data breach affects you, we will notify you and the National Privacy Commission as the law requires.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    body: [
      "Under the Data Privacy Act you have the right to:",
      {
        list: [
          "be informed about how your data is used;",
          "access the data we hold about you;",
          "object to certain uses of your data;",
          "correct inaccurate data;",
          "ask us to erase or block your data, in the cases the law allows;",
          "receive your data in a usable format (data portability);",
          "claim damages if your data was misused;",
          "file a complaint with the National Privacy Commission.",
        ],
      },
      `You can update your name, phone and address yourself on your Account page. For anything else, email ${LEGAL.email} and we will reply within a reasonable time. We may need to confirm it is really you first. If you ask us to delete your data, we may still keep what the law requires us to keep, such as order records.`,
    ],
  },
  {
    id: "children",
    title: "Children",
    body: [
      "Our shop is not meant for people under 18. If you are under 18, please use it only with a parent's or guardian's permission. If you believe a child has given us personal information without permission, email us and we will delete it.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: [
      "Our site keeps you logged in and remembers your light or dark mode using your browser's storage. Details are in our Cookie Policy.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "We may update this policy from time to time. The date at the top shows when it last changed. If the change is important, we will tell you on the site or by email.",
    ],
  },
  {
    id: "contact",
    title: "Contact and complaints",
    body: [
      `Email: ${LEGAL.email}. Instagram: ${LEGAL.instagram}. Location: ${LEGAL.location}.`,
      "If you are not happy with how we handled your data, you can complain to the National Privacy Commission of the Philippines at privacy.gov.ph.",
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We respect your privacy. This policy explains what personal information we collect when you use our website, why we collect it, who sees it, and what choices you have."
      sections={sections}
    />
  );
}