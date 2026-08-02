export type Language = "en" | "ar";

export const languageStorageKey = "wedding-language";

export const registryPhoneNumber = "81 231 042";

export type Copy = {
  dir: "ltr" | "rtl";
  documentTitle: string;
  switchLabel: string;
  switchAria: string;
  sections: readonly string[];
  navAria: string;
  goToSection: (position: number, section: string) => string;
  couple: string;
  coupleStacked: readonly [string, string, string];
  announcement: string;
  dateLine: string;
  countdown: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  scrollCue: string;
  scripture: string;
  invitationBody: string;
  weddingDate: string;
  ceremonyTitle: string;
  church: string;
  ceremonyTime: string;
  churchLink: string;
  venue: string;
  venueLink: string;
  registryTitle: string;
  registryPresence: string;
  registryIntro: string;
  registryPhoneLabel: string;
  rsvpTitle: string;
  rsvpDeadline: string;
  adultsOnlyNote: string;
  guestCountLabel: string;
  loadingInvitation: string;
  noInvitationCode: string;
  guestFallbackName: string;
  accept: string;
  decline: string;
  confirm: string;
  confirming: string;
  rsvpThanks: string;
  invitationNotFound: (code: string) => string;
  invitationLoadFailed: string;
  rsvpFailed: string;
  closingTitle: string;
};

export const translations: Record<Language, Copy> = {
  en: {
    dir: "ltr",
    documentTitle: "Karim & Mirna - Wedding Invitation",
    switchLabel: "العربية",
    switchAria: "Switch to Arabic",
    sections: [
      "Welcome",
      "Invitation",
      "Ceremony",
      "Registry",
      "RSVP",
      "Together",
    ],
    navAria: "Invitation sections",
    goToSection: (position, section) => `Go to section ${position}: ${section}`,
    couple: "Karim & Mirna",
    coupleStacked: ["Karim", "&", "Mirna"],
    announcement: "Are getting married!",
    dateLine: "Sunday · September 20 · 2026",
    countdown: {
      days: "Days",
      hours: "Hours",
      minutes: "Mins",
      seconds: "Secs",
    },
    scrollCue: "Scroll",
    scripture:
      '"What God has joined together, let no one separate." (Matthew 19:6)',
    invitationBody:
      "With joyful hearts, together with our families, invite you to celebrate our love and witness our marriage.",
    weddingDate: "Sunday, September 20, 2026",
    ceremonyTitle: "Wedding Ceremony",
    church: "St. Catherine Church",
    ceremonyTime: "6:00 PM",
    churchLink: "Church Location",
    venue: "Chez Fouad",
    venueLink: "Venue Location",
    registryTitle: "Gift Registry",
    registryPresence: "Your presence is the greatest gift we could ask for.",
    registryIntro:
      "For those who wish, our wedding registry is available at Whish Money:",
    registryPhoneLabel: "Phone number:",
    rsvpTitle: "We would be honored by your presence!",
    rsvpDeadline: "Appreciate your kind reply before 6 September 2026.",
    adultsOnlyNote:
      "Children in the care of those you love, and the evening for the grown-ups.",
    guestCountLabel: "Number of guests:",
    loadingInvitation: "Loading your invitation...",
    noInvitationCode: "No invitation code was provided.",
    guestFallbackName: "Guest Name",
    accept: "Accept",
    decline: "Decline",
    confirm: "Press to confirm",
    confirming: "Confirming...",
    rsvpThanks: "Thank you. Your response has been noted ♡",
    invitationNotFound: (code) => `Invitation code "${code}" was not found.`,
    invitationLoadFailed: "Unable to load this invitation.",
    rsvpFailed: "Unable to submit your RSVP.",
    closingTitle: "We can't wait to celebrate with you.",
  },
  ar: {
    dir: "rtl",
    documentTitle: "كريم وميرنا - دعوة زفاف",
    switchLabel: "English",
    switchAria: "التبديل إلى اللغة الإنجليزية",
    sections: [
      "ترحيب",
      "الدعوة",
      "حفل الزفاف",
      "الهدايا",
      "تأكيد الحضور",
      "معًا",
    ],
    navAria: "أقسام الدعوة",
    goToSection: (position, section) =>
      `الانتقال إلى القسم ${position}: ${section}`,
    couple: "كريم وميرنا",
    coupleStacked: ["كريم", "و", "ميرنا"],
    announcement: "سيتزوّجان!",
    dateLine: "الأحد · 20 أيلول · 2026",
    countdown: {
      days: "يوم",
      hours: "ساعة",
      minutes: "دقيقة",
      seconds: "ثانية",
    },
    scrollCue: "مرّر",
    scripture: '"ما جمعه الله لا يفرقه إنسان." (متى 19:6)',
    invitationBody:
      "بقلوبٍ مفعمة بالفرح، ومع عائلتينا، ندعوكم لمشاركتنا فرحنا وحضور حفل زفافنا.",
    weddingDate: "الأحد 20 أيلول 2026",
    ceremonyTitle: "حفل الزفاف",
    church: "كنيسة القدّيسة كاترين",
    ceremonyTime: "6:00 مساءً",
    churchLink: "موقع الكنيسة",
    venue: "شيه فؤاد",
    venueLink: "موقع الصالة",
    registryTitle: "قائمة الهدايا",
    registryPresence: "حضوركم أثمن هدية نتمناها.",
    registryIntro: "ولمن يرغب، يمكنكم إرسال هديتكم عبر Whish Money:",
    registryPhoneLabel: "رقم الهاتف:",
    rsvpTitle: "يشرّفنا حضوركم!",
    rsvpDeadline: "نرجو تأكيد حضوركم قبل 6 أيلول 2026.",
    adultsOnlyNote: "الأطفال في رعاية من تحبون، والأمسية للكبار.",
    guestCountLabel: "عدد المدعوين:",
    loadingInvitation: "جارٍ تحميل دعوتكم...",
    noInvitationCode: "لم يتم إدخال رمز الدعوة.",
    guestFallbackName: "اسم المدعو",
    accept: "قبول",
    decline: "اعتذار",
    confirm: "اضغط للتأكيد",
    confirming: "جارٍ التأكيد...",
    rsvpThanks: "شكرًا لكم. تم تسجيل ردّكم ♡",
    invitationNotFound: (code) => `لم يتم العثور على رمز الدعوة "${code}".`,
    invitationLoadFailed: "تعذّر تحميل هذه الدعوة.",
    rsvpFailed: "تعذّر إرسال ردّكم.",
    closingTitle: "لا نطيق صبرًا للاحتفال معكم.",
  },
};
