import LegalPage from "../components/LegalPage.jsx";
import { LEGAL } from "../lib/legal.js";

const REPORT_DAYS = 3; // days to report a damaged, defective or wrong item
const REFUND_DAYS = 7; // days to send an approved refund
const COURT = "Pangasinan"; // where disputes are heard
const DELIVERY_AREA = "within the Philippines";

const sections = [
  {
    id: "accept",
    title: "Agreeing to these terms",
    body: [
      `By using the ${LEGAL.brand} website, creating an account or placing an order, you agree to these Terms and Conditions and to our Privacy Policy and Cookie Policy. If you do not agree, please do not use the site.`,
      "You must be at least 18 to place an order, or have a parent's or guardian's permission.",
    ],
  },
  {
    id: "accounts",
    title: "Your account",
    body: [
      "You can browse the shop without an account. You need an account to take the perfume quiz and to place orders.",
      {
        list: [
          "Give us true and current information, and confirm your email address.",
          "Keep your password safe. You are responsible for what happens on your account.",
          "You can sign in with Google. Google's own terms apply to that sign-in.",
          "We may suspend or close an account that is used for fraud, abuse or breaking these terms.",
        ],
      },
    ],
  },
  {
    id: "products",
    title: "Our fragrances",
    body: [
      "Our fragrances are our own compositions. Some are described as inspired by well-known fragrances. We are not affiliated with, endorsed by or sponsored by the owners of those brands. Their names are used only to describe the character of a scent.",
      "Scent notes, descriptions and photos are a guide. A perfume smells different on different skin, and bottles and packaging may look slightly different from the photos.",
      "Fragrance safety: for external use only. Avoid contact with eyes and broken skin. Test a small amount on your skin first if you have allergies or sensitive skin, and stop using it if irritation occurs. Perfume is flammable, so keep it away from heat and flame, and out of reach of children.",
    ],
  },
  {
    id: "orders",
    title: "Placing an order",
    body: [
      "Placing an order is a request to buy. We accept it when we confirm your payment. Stock is limited and is set aside for you only when we confirm payment, so an order is not a guarantee that the item is still available.",
      "If an item sells out before we confirm payment, we will tell you and refund you in full. We may also cancel an order for a pricing mistake, suspected fraud or a problem with the delivery details.",
      "Order status: Pending means we are waiting to confirm your payment. Paid means we confirmed it. Fulfilled means your order was completed. Cancelled means it was stopped.",
    ],
  },
  {
    id: "payment",
    title: "Prices and payment",
    body: [
      {
        list: [
          "All prices are in Philippine pesos (PHP). The shipping fee is shown at checkout before you pay.",
          "We accept GCash only. At checkout we show our GCash details. Send the exact total, then upload your receipt.",
          "We check every receipt by hand, so it may take some time. A wrong amount or an unclear receipt can delay your order.",
          "Only pay to the GCash account shown at checkout. We will never ask you to pay to another account or to share your GCash PIN or one-time codes.",
          "Uploading an edited or fake receipt is fraud. We will cancel the order, close the account and may report it.",
        ],
      },
    ],
  },
  {
    id: "vouchers",
    title: "Vouchers",
    body: [
      "Vouchers have their own conditions, such as a minimum spend, a validity period and a usage limit, shown when you apply them. They have no cash value and cannot be exchanged for money. We may cancel a voucher or an order if a voucher is misused.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    body: [
      `We deliver ${DELIVERY_AREA} to the address you give us. Please check your address and mobile number carefully. Delivery times we give are estimates, not guarantees, and couriers can be delayed by weather, holidays and other things outside our control.`,
      "If delivery fails because of wrong or incomplete details, or because nobody collects the parcel, you may need to pay for re-shipping. Responsibility for the parcel passes to you when it is delivered.",
    ],
  },
  {
    id: "returns",
    title: "Cancellations, returns and refunds",
    body: [
      {
        list: [
          "Before we confirm your payment, you can cancel your order.",
          "After payment but before we ship, contact us as soon as you can and we will try to cancel it.",
          "Once an order has been shipped, it can no longer be cancelled.",
          `Perfume is a personal-care product. We accept a return, replacement or refund only if your item arrives damaged, defective or wrong. Tell us within ${REPORT_DAYS} days of receiving it, with clear photos or an unboxing video.`,
          "Opened or used perfume cannot be returned because you do not like the scent.",
          `Approved refunds are sent to your GCash within ${REFUND_DAYS} days.`,
        ],
      },
      "Nothing in this section limits your rights under Philippine consumer laws.",
    ],
  },
  {
    id: "messages",
    title: "Emails from us",
    body: [
      "We send you emails about your account and orders. If you subscribe, or have an account, we may also send announcements about new scents and stocks. You can unsubscribe from announcements at any time using the link in the email.",
    ],
  },
  {
    id: "use",
    title: "Acceptable use",
    body: [
      "Please do not:",
      {
        list: [
          "use the site for anything unlawful or fraudulent;",
          "create fake accounts or upload fake or altered receipts;",
          "try to break, overload or gain unauthorized access to the site or other people's accounts;",
          "copy or collect our content or data with bots or scrapers.",
        ],
      },
    ],
  },
  {
    id: "ip",
    title: "Our content",
    body: [
      `The ${LEGAL.brand} name, logo, photos, text, designs, quiz and website are ours or used with permission. You may not copy or reuse them without our written permission. When you upload something, such as a payment receipt, you allow us to use it only to run your order and keep our records.`,
    ],
  },
  {
    id: "liability",
    title: "Our responsibility",
    body: [
      `We work hard to keep the site accurate and running, but it is provided "as is", and we cannot promise it will always be available or error-free. To the extent the law allows, we are not responsible for indirect or consequential losses, and our total responsibility for any order is limited to the amount you paid for it. This does not limit anything the law does not allow us to limit, such as your consumer rights or responsibility for fraud.`,
      "We are not responsible for problems with services we do not control, such as GCash, Google, internet providers or courier companies.",
    ],
  },
  {
    id: "changes",
    title: "Changes",
    body: [
      "We may change these terms, our products, prices or the site at any time. The date at the top shows the latest version. If you keep using the site after a change, you accept the new terms. Orders already placed stay under the terms that applied when you ordered.",
    ],
  },
  {
    id: "law",
    title: "Governing law",
    body: [
      `These terms are governed by the laws of the Republic of the Philippines. If there is a problem, please contact us first and we will try to fix it. If we cannot settle it, it may be brought before the proper courts of ${COURT}.`,
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    body: [
      `Email: ${LEGAL.email}. Instagram: ${LEGAL.instagram}. Location: ${LEGAL.location}.`,
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro="These terms explain the rules for using our website and buying from us. Please read them before you place an order."
      sections={sections}
    />
  );
}