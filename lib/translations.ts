export const registryPhoneNumber = "71 570 046";

export type Copy = {
  documentTitle: string;
  sections: readonly string[];
  navAria: string;
  goToSection: (position: number, section: string) => string;
  basmala: string;
  verse: readonly [string, string];
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
  invitationBody: readonly [string, string];
  weddingDate: string;
  ceremonyTitle: string;
  ceremonyTime: string;
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
  closingTitle: readonly [string, string];
  envelopeHint: string;
  envelopeAria: string;
  envelopeLetterLabel: string;
};

// The invitation is now Arabic-only; there is a single copy deck.
export const copy: Copy = {
  documentTitle: "محمد وميرنا - دعوة زفاف",
  sections: ["ترحيب", "الدعوة", "حفل الزفاف", "الهدايا", "تأكيد الحضور", "معًا"],
  navAria: "أقسام الدعوة",
  goToSection: (position, section) =>
    `الانتقال إلى القسم ${position}: ${section}`,
  basmala: "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
  verse: [
    "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنْفُسِكُمْ أَزْوَاجًا",
    "لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَة",
  ],
  couple: "مُحَمَّد وَمِيْرُنَا",
  coupleStacked: ["محمد", "و", "ميرنا"],
  announcement: "سيتزوّجان!",
  dateLine: "الإثنين · 5 تشرين الأول · 2026",
  countdown: {
    days: "يوم",
    hours: "ساعة",
    minutes: "دقيقة",
    seconds: "ثانية",
  },
  scrollCue: "مرّر",
  invitationBody: [
    "بقلوبٍ مفعمة بالفرح، ومع عائلتينا، ندعوكم",
    "لمشاركتنا فرحنا وحضور حفل زفافنا.",
  ],
  weddingDate: "الإثنين 5 تشرين الأول 2026",
  ceremonyTitle: "حفل الزفاف",
  ceremonyTime: "7:00 مساءً",
  venue: "Byblos Palace",
  venueLink: "موقع الصالة",
  registryTitle: "قائمة الهدايا",
  registryPresence: "حضوركم أثمن هدية نتمناها.",
  registryIntro: "ولمن يرغب، يمكنكم إرسال هديتكم عبر Whish Money:",
  registryPhoneLabel: "رقم الهاتف:",
  rsvpTitle: "يشرّفنا حضوركم!",
  rsvpDeadline: "نرجو تأكيد حضوركم قبل 25 أيلول 2026.",
  adultsOnlyNote: "نومًا هنيئًا لأطفالكم",
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
  closingTitle: ["لا نطيق صبرًا", "للاحتفال معكم."],
  envelopeHint: "اضغطوا لفتح الدعوة",
  envelopeAria: "افتحوا دعوة الزفاف",
  envelopeLetterLabel: "دعوة زفاف",
};
