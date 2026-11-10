// Mock data for the frontend phase. Each export can later be replaced
// by a Supabase query without touching the components.
import song1 from "../assets/music/song1.mp3";
import song2 from "../assets/music/song2.mp3";

import me1 from "../assets/images/me1.jpg";
import me2 from "../assets/images/me2.jpg";
import me3 from "../assets/images/me3.jpg";
import graduationPic from "../assets/images/graduation_pic.jpg";
import idPic from "../assets/images/ID_Pic.webp";
import collegeMates from "../assets/images/college_mates.jpg";
import memories from "../assets/images/memories.jpg";
import ridesCm from "../assets/images/rides_cm.jpg";
import party from "../assets/images/party.jpg";
import myBro from "../assets/images/my_bro.jpg";

export const WELCOME_MESSAGE =
  "Hello. I'm whatTheLlyd. Ask me anything about Lloyd — his work, skills, life, or how to reach him.";

export const SUGGESTIONS = [
  "What are his hobbies?",
  "What skills does he have?",
  "Tell me about his experience",
  "How can I contact him?",
  "Who's his Friends??",
  "Is he open to work?",
];

export const SONGS = [
  { src: song1, label: "Rainbow — Gatton" },
  { src: song2, label: "Japanese Denim — Daniel Caesar" },
];

export const PLAYLIST_MESSAGE =
  "Here are the songs in Lloyd's playlist:\n\n• Rainbow — Gatton\n  Lloyd's comfort song. He turns to this whenever he needs reassurance or peace.\n\n• Japanese Denim — Daniel Caesar\n  Lloyd's all-time favorite. Soulful, emotional, and deeply meaningful to him.\n\nWhich one would you like to play?";

export const IMAGE_MAP = {
  profile:    { src: me1,            caption: "Lloyd" },
  casual1:    { src: me2,            caption: "Lloyd — casual" },
  casual2:    { src: me3,            caption: "Lloyd — chill mode" },
  graduation: { src: graduationPic,  caption: "Lloyd — Graduation" },
  id:         { src: idPic,          caption: "Lloyd — ID Photo" },
  mates:      { src: collegeMates,   caption: "Lloyd with his college mates" },
  memories:   { src: memories,       caption: "Lloyd — memories" },
  rides:      { src: ridesCm,        caption: "Lloyd — out and about" },
  party:      { src: party,          caption: "Lloyd — party vibes" },
  bro:        { src: myBro,          caption: "Lloyd and his bro" },
};
