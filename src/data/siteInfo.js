// Text shown in the sidebar pages. Edit here, no other code needs to change.

export const OWNER_NAME = "Lloyd";
export const OWNER_LOCATION = "Calbayog City, Samar, Philippines";

export const CONTACT = [
  { id: "email", label: "Email", value: "johntiman.08@gmail.com", href: "mailto:johntiman.08@gmail.com" },
  { id: "phone", label: "Phone", value: "+63 991 185 7880", href: "tel:+639911857880" },
  { id: "website", label: "Website", value: "alky.lovestoblog.com", href: "https://alky.lovestoblog.com" },
  { id: "facebook", label: "Facebook", value: "Lloyd", href: "https://www.facebook.com/share/1AwQZpAd2e/" },
  { id: "instagram", label: "Instagram", value: "@llydeu", href: "https://www.instagram.com/llydeu" },
  { id: "tiktok", label: "TikTok", value: "@jllydf", href: "https://www.tiktok.com/@jllydf" },
];

export const ABOUT_SECTIONS = [
  {
    title: "What is whatTheLlyd?",
    body: [
      "whatTheLlyd is a personal AI assistant that answers questions about Lloyd: his skills, experience, interests, and how to reach him. Instead of reading a static portfolio, you just ask.",
    ],
  },
  {
    title: "What you can do here",
    list: [
      "Ask anything about Lloyd in the chat.",
      "Tap Suggested questions if you don't know where to start.",
      "Ask to see photos or hear songs from his playlist.",
      "Browse everything he has shared in Media: photos, videos, music, links and files.",
    ],
  },
  {
    title: "How it works",
    body: [
      "Your message is sent through a secure server to an AI language model, together with the information John wrote about himself. The AI answers from that information, so it can only speak about what he has shared.",
      "The site is built with React, Supabase and Cloudflare Workers, and it can be installed on your phone or computer like an app.",
    ],
  },
  {
    title: "Good to know",
    list: [
      "AI can make mistakes. For anything important, like a job opportunity, contact John directly.",
      "Each time you refresh or return to the intro screen, a new chat starts.",
      "To keep the service available for everyone, each visitor can send a limited number of messages every couple of minutes.",
    ],
  },
];

export const PRIVACY_UPDATED = "November 2026";

export const PRIVACY_SECTIONS = [
  {
    title: "Your messages",
    body: [
      "What you type in the chat is sent to a third-party AI service to generate a reply, and the conversation is saved in the site's database. Lloyd can access saved conversations. Please don't share passwords, ID numbers or other sensitive information in the chat.",
    ],
  },
  {
    title: "Your device",
    body: [
      "The site keeps a random device ID in your browser, along with the device type, browser, operating system and how often you visit. This is used for simple visitor counts. IP addresses are not stored with it.",
    ],
  },
  {
    title: "Abuse protection and statistics",
    body: [
      "To stop spam and control costs, requests are limited per IP address. For usage statistics, only a scrambled (hashed) form of your IP address is kept, together with whether a request succeeded, how long it took and how many tokens it used. Message text is not part of these statistics.",
    ],
  },
  {
    title: "Your choices",
    list: [
      "Clearing your browser's site data resets your device ID.",
      "To ask for a conversation to be removed, contact John using the details on the Contact page.",
    ],
  },
];
