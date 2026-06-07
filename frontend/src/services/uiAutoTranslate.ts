import type { AppLanguage } from "@/services/language";

const attributeNames = ["placeholder", "title", "aria-label", "alt"];
const originalTextNodes = new WeakMap<Text, string>();

const arText: Record<string, string> = {
  "AI Assistant": "المساعد الذكي",
  "Ask me anything about your journey in natural language": "اسألني عن رحلتك بلغة طبيعية",
  "Describe Your Journey": "صف رحلتك",
  "Tell us where you want to go and your preferences. We'll find the best routes for you.": "اكتب وجهتك وتفضيلاتك، وسنقترح أفضل المسارات لك.",
  "Example: I need the fastest route from Nasr City to Cairo Airport with minimal walking.": "مثال: أحتاج أسرع طريق من مدينة نصر إلى مطار القاهرة مع أقل مشي.",
  "Search Route": "ابحث عن مسار",
  "Try asking:": "جرب أن تسأل:",
  "I can help with:": "يمكنني مساعدتك في:",
  "Need a full trip plan?": "تحتاج خطة رحلة كاملة؟",
  "Use AI Trip Planner for complete day itineraries with attractions, restaurants, and transport.": "استخدم مخطط الرحلات الذكي لإنشاء برنامج يومي كامل يشمل المزارات والمطاعم والمواصلات.",
  "Try Trip Planner": "جرب مخطط الرحلات",
  "Route Planning": "تخطيط المسارات",
  "Find the best way to get anywhere": "اعرف أفضل طريقة للوصول لأي مكان",
  "Time & Cost": "الوقت والتكلفة",
  "Balance speed and budget": "وازن بين السرعة والميزانية",
  "Smart Suggestions": "اقتراحات ذكية",
  "Personalized recommendations": "توصيات مخصصة",
  "Trip Planning": "تخطيط الرحلات",
  "Full day itineraries": "برامج يوم كامل",
  "Get me to Cairo Airport in under an hour": "وصلني إلى مطار القاهرة في أقل من ساعة",
  "What's the cheapest way to reach Giza Pyramids?": "ما أرخص طريقة للوصول إلى أهرامات الجيزة؟",
  "Find a comfortable route to New Cairo": "ابحث عن طريق مريح إلى القاهرة الجديدة",
  "How do I get to City Stars Mall?": "كيف أصل إلى سيتي ستارز مول؟",

  "AI Trip Planner": "مخطط الرحلات الذكي",
  "Let AI create a complete day itinerary with attractions, restaurants, and transport": "دع الذكاء الاصطناعي ينشئ برنامج يوم كامل بالمزارات والمطاعم والمواصلات",
  "Tell me about your trip": "أخبرني عن رحلتك",
  "What kind of trip are you planning?": "ما نوع الرحلة التي تخطط لها؟",
  "E.g., A weekend cultural tour of Cairo...": "مثال: جولة ثقافية في القاهرة في عطلة نهاية الأسبوع...",
  "Trip Duration": "مدة الرحلة",
  "Number of days": "عدد الأيام",
  "Total Budget (EGP)": "إجمالي الميزانية (جنيه)",
  "Your budget": "ميزانيتك",
  "Select your interests": "اختر اهتماماتك",
  "Generate My Trip Plan": "أنشئ خطة رحلتي",
  "Popular Trip Ideas": "أفكار رحلات شائعة",
  "How it works": "كيف يعمل",
  "Tell us your preferences": "أخبرنا بتفضيلاتك",
  "Duration, budget, and interests": "المدة والميزانية والاهتمامات",
  "AI creates your plan": "الذكاء الاصطناعي ينشئ خطتك",
  "Attractions, food, and transport": "مزارات وطعام ومواصلات",
  "Save your trip": "احفظ رحلتك",
  "Access it anytime": "افتحها في أي وقت",
  "Included in your plan": "الموجود في خطتك",
  "AI-generated daily itineraries": "برامج يومية منشأة بالذكاء الاصطناعي",
  "Personalized activity suggestions": "اقتراحات أنشطة مخصصة",
  "Restaurant and cafe recommendations": "ترشيحات مطاعم ومقاه",
  "Detailed cost breakdown": "تفصيل دقيق للتكلفة",
  "Cultural Sites": "أماكن ثقافية",
  "Food & Dining": "طعام ومطاعم",
  "Shopping": "تسوق",
  "Parks & Nature": "حدائق وطبيعة",
  "Historical": "تاريخي",
  "Modern Cairo": "القاهرة الحديثة",
  "Ancient Cairo Explorer": "استكشاف القاهرة القديمة",
  "Food Lover's Tour": "جولة لعشاق الطعام",
  "Modern Cairo Experience": "تجربة القاهرة الحديثة",
  "Weekend Cultural Tour": "جولة ثقافية في عطلة نهاية الأسبوع",

  "Saved": "محفوظ",
  "Save": "حفظ",
  "Share": "مشاركة",
  "Export": "تصدير",
  "Cost Breakdown": "تفصيل التكلفة",
  "Attractions": "المزارات",
  "Transport": "المواصلات",
  "Total Cost": "إجمالي التكلفة",
  "Budget:": "الميزانية:",
  "Remaining:": "المتبقي:",
  "AI Recommendations": "توصيات الذكاء الاصطناعي",
  "This itinerary balances cultural exploration with authentic local cuisine. Transport is optimized for time and cost.": "هذا البرنامج يوازن بين الاستكشاف الثقافي والطعام المحلي الأصيل. وتم تحسين المواصلات حسب الوقت والتكلفة.",

  "Welcome Back": "مرحباً بعودتك",
  "Sign in to your Mwasalaty account": "سجل الدخول إلى حساب مواصلاتي",
  "Email or Phone": "البريد الإلكتروني أو الهاتف",
  "your@email.com": "your@email.com",
  "Password": "كلمة المرور",
  "Enter your password": "اكتب كلمة المرور",
  "Remember me": "تذكرني",
  "Forgot password?": "نسيت كلمة المرور؟",
  "Sign In": "تسجيل الدخول",
  "Continue as Guest": "المتابعة كزائر",
  "Don't have an account?": "ليس لديك حساب؟",
  "Create Account": "إنشاء حساب",
  "Join Mwasalaty and start planning smarter trips": "انضم إلى مواصلاتي وابدأ تخطيط رحلات أذكى",
  "Full Name": "الاسم الكامل",
  "Enter your full name": "اكتب اسمك الكامل",
  "Phone Number": "رقم الهاتف",
  "+20 1XX XXX XXXX": "+20 1XX XXX XXXX",
  "Confirm Password": "تأكيد كلمة المرور",
  "Create Your Account": "أنشئ حسابك",
  "Already have an account?": "لديك حساب بالفعل؟",
  "Reset Password": "إعادة تعيين كلمة المرور",
  "Enter your email and we'll send you reset instructions": "اكتب بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين",
  "Send Reset Link": "إرسال رابط إعادة التعيين",
  "Back to Sign In": "العودة لتسجيل الدخول",

  "Profile": "الملف الشخصي",
  "Settings": "الإعدادات",
  "Support": "الدعم",
  "Personal Information": "المعلومات الشخصية",
  "Edit Profile": "تعديل الملف",
  "Payment Methods": "طرق الدفع",
  "Saved Cards": "البطاقات المحفوظة",
  "Add Payment Method": "إضافة طريقة دفع",
  "Notifications": "الإشعارات",
  "Language": "اللغة",
  "Appearance": "المظهر",
  "Help Center": "مركز المساعدة",
  "Contact Support": "تواصل مع الدعم",

  "Route Options": "خيارات المسار",
  "Leaving now": "المغادرة الآن",
  "Fastest": "الأسرع",
  "Cheapest": "الأرخص",
  "Comfortable": "الأكثر راحة",
  "Most Comfortable": "الأكثر راحة",
  "View Details": "عرض التفاصيل",
  "Total Duration": "إجمالي المدة",
  "Transfers": "التبديلات",
  "Walking": "المشي",
  "Map Overview": "نظرة عامة على الخريطة",
  "Interactive map showing all routes": "خريطة تفاعلية تعرض كل المسارات",
  "Distance": "المسافة",
  "Walk to Destination": "امشِ إلى الوجهة",
  "Walk to": "امشِ إلى",
  "Bus": "أتوبيس",
  "Metro": "مترو",
  "Route Details": "تفاصيل المسار",
  "Live Navigation": "الملاحة المباشرة",
  "Book Ticket": "حجز تذكرة",
  "Start Navigation": "بدء الملاحة",
  "Directions": "الاتجاهات",

  "Saved Places": "الأماكن المحفوظة",
  "Saved Routes": "المسارات المحفوظة",
  "AI Plans": "خطط الذكاء الاصطناعي",
  "Offline Maps": "خرائط بدون إنترنت",
  "Add Place": "إضافة مكان",
  "Place name": "اسم المكان",
  "Address or location": "العنوان أو الموقع",
  "Home": "المنزل",
  "Work": "العمل",
  "School": "الدراسة",
  "Other": "أخرى",
  "Cancel": "إلغاء",
  "Plan Route": "تخطيط مسار",
  "Quick route": "مسار سريع",
  "Delete Place": "حذف المكان",
  "Saved place actions": "إجراءات المكان المحفوظ",

  "All Tickets": "كل التذاكر",
  "Active Tickets": "التذاكر النشطة",
  "Past Tickets": "التذاكر السابقة",
  "Ticket": "تذكرة",
  "Booking": "الحجز",
  "Payment Successful": "تم الدفع بنجاح",
  "Payment Cancelled": "تم إلغاء الدفع",
  "Your ticket is ready": "تذكرتك جاهزة",
  "Download Ticket": "تنزيل التذكرة",
  "Back Home": "العودة للرئيسية",
  "Try Again": "حاول مرة أخرى",

  "Operator Scan": "مسح المشغل",
  "Scan Ticket": "مسح التذكرة",
  "Enter Ticket Code": "اكتب كود التذكرة",
  "Validate Ticket": "تحقق من التذكرة",
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translatePlainText(text: string, language: AppLanguage) {
  if (language !== "ar") return text;
  const normalized = normalizeText(text);
  return arText[normalized] ?? text;
}

function translateTextNode(node: Text, language: AppLanguage) {
  const original = originalTextNodes.get(node) ?? node.nodeValue ?? "";
  const normalized = normalizeText(original);
  if (!normalized) return;

  if (!originalTextNodes.has(node)) {
    originalTextNodes.set(node, original);
  }

  const translated = translatePlainText(original, language);
  if (translated !== node.nodeValue) {
    node.nodeValue = original.replace(normalized, normalizeText(translated));
  }
}

function translateAttributes(element: Element, language: AppLanguage) {
  for (const attr of attributeNames) {
    const value = element.getAttribute(attr);
    if (!value) continue;

    const dataKey = `i18nOriginal${attr.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}`;
    const original = (element as HTMLElement).dataset[dataKey] ?? value;
    if (!(element as HTMLElement).dataset[dataKey]) {
      (element as HTMLElement).dataset[dataKey] = original;
    }

    element.setAttribute(attr, translatePlainText(original, language));
  }
}

export function applyUiAutoTranslations(language: AppLanguage, root: ParentNode = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) continue;
    textNodes.push(node);
  }

  textNodes.forEach((node) => translateTextNode(node, language));
  root.querySelectorAll?.("*").forEach((element) => translateAttributes(element, language));
}

export function watchUiAutoTranslations(getLanguage: () => AppLanguage) {
  let queued = false;
  const run = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      applyUiAutoTranslations(getLanguage());
    });
  };

  const observer = new MutationObserver(run);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: attributeNames,
  });

  run();
  return () => observer.disconnect();
}
