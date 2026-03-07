export type Locale = 'en' | 'am';

export const LOCALE_STORAGE_KEY = 'herizone-locale';

const messages = {
  en: {
    nav: {
      home: 'Home',
      community: 'Community',
      learn: 'Learn',
      experts: 'Ask Experts',
      admin: 'Admin',
      myProfile: 'My Profile',
      signOut: 'Sign Out',
      openNav: 'Open navigation menu',
      goHome: 'Go to home',
    },
    authHeader: {
      signIn: 'Sign in',
      joinFree: 'Join free',
      restoring: 'Restoring your session...',
    },
    home: {
      eyebrow: 'Herizone Community',
      title1: "You don't have",
      title2: 'to navigate',
      title3: 'motherhood',
      title4: 'alone.',
      subtitle:
        'Herizone connects mothers with a supportive community, trusted educational resources, verified healthcare experts, and an AI assistant at every stage of the journey.',
      getStarted: 'Get Started',
      joinCommunity: 'Join the Community',
    },
  },
  am: {
    nav: {
      home: 'መነሻ',
      community: 'ማህበረሰብ',
      learn: 'ትምህርት',
      experts: 'ባለሙያ ይጠይቁ',
      admin: 'አስተዳዳሪ',
      myProfile: 'ፕሮፋይሌ',
      signOut: 'ውጣ',
      openNav: 'የአሰሳ ማውጫ ክፈት',
      goHome: 'ወደ መነሻ ሂድ',
    },
    authHeader: {
      signIn: 'ግባ',
      joinFree: 'በነፃ ተቀላቀል',
      restoring: 'ክፍለ ጊዜዎን በመመለስ ላይ...',
    },
    home: {
      eyebrow: 'የሄሪዞን ማህበረሰብ',
      title1: 'ብቻዎን',
      title2: 'የእናትነት ጉዞን',
      title3: 'ማለፍ',
      title4: 'አያስፈልግም።',
      subtitle:
        'ሄሪዞን እናቶችን ከድጋፍ ማህበረሰብ፣ ከታመኑ የትምህርት ምንጮች፣ ከተረጋገጡ የጤና ባለሙያዎች እና ከAI ረዳት ጋር በእያንዳንዱ ደረጃ ያገናኛል።',
      getStarted: 'ጀምር',
      joinCommunity: 'ማህበረሰቡን ተቀላቀል',
    },
  },
} as const;

export function t(locale: Locale, key: string): string {
  const [group, item] = key.split('.');
  const table = messages[locale] as Record<string, Record<string, string>>;
  const fallback = messages.en as Record<string, Record<string, string>>;
  return table?.[group]?.[item] || fallback?.[group]?.[item] || key;
}
