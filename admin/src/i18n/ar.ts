const ar = {
  common: {
    appName: "تحكم مواصلاتي",
    save: "حفظ التغييرات", cancel: "إلغاء", delete: "حذف", edit: "تعديل", retry: "إعادة المحاولة",
    loading: "جار التحميل", active: "نشط", inactive: "غير نشط", routes: "الخطوط", aliases: "الأسماء البديلة",
    name: "الاسم", status: "الحالة", latitude: "خط العرض", longitude: "خط الطول", line: "خط المترو",
    new: "جديد", back: "رجوع", confirm: "تأكيد", noData: "لا توجد سجلات", language: "English"
  },
  nav: { dashboard: "لوحة التحكم", stops: "المواقف", stations: "المحطات", logout: "تسجيل الخروج" },
  auth: {
    title: "غرفة تحكم الشبكة", subtitle: "استخدم كلمة سر الإدارة المشتركة للدخول.",
    secret: "كلمة سر الإدارة", submit: "دخول غرفة التحكم", error: "تعذر التحقق من صلاحية الدخول.",
    sessionExpired: "انتهت الجلسة. سجل الدخول مرة أخرى.", signedOut: "تم تسجيل الخروج."
  },
  stateView: {
    loading: { headline: "جار تحميل السجلات", support: "نقرأ دليل النقل المباشر." },
    empty: { headline: "لا توجد بيانات بعد", support: "أنشئ أول سجل للبدء." },
    error: { headline: "تعذر تحميل السجلات", support: "تحقق من الخادم وحاول مرة أخرى." }
  },
  places: {
    stop: "موقف", station: "محطة", newStop: "موقف جديد", newStation: "محطة جديدة",
    editStop: "تعديل موقف", editStation: "تعديل محطة", routeCount: "الخطوط التي تخدم المكان",
    aliasCount: "الأسماء البديلة", deleteTitle: "حذف هذا المكان؟", deleteMessage: "سيتم حذف السجل نهائيا.",
    aliasesHelp: "تهجئات بديلة يستخدمها بحث الركاب.", addAlias: "إضافة اسم", removeAlias: "إزالة",
    routesHelp: "اختر خطا معروفا واحدا على الأقل.", formIntro: "تحديث السجل ينعكس فورا في بحث الركاب.",
    saved: "تم حفظ السجل.", warningTitle: "تم الحفظ مع تنبيهات", duplicate: "يوجد سجل قريب يحمل الاسم نفسه.",
    outOfCoverage: "هذا الموقع خارج نطاق القاهرة الكبرى.", requiredName: "الاسم مطلوب.",
    requiredLocation: "الإحداثيات الصحيحة مطلوبة.", requiredRoutes: "اختر خطا واحدا على الأقل.",
    requiredLine: "خط المترو مطلوب للمحطات.", unsaved: "لديك تغييرات غير محفوظة. هل تريد المغادرة؟"
  },
  dashboard: {
    title: "سجل الشبكة", subtitle: "عرض تشغيلي مباشر لدليل الأماكن الظاهر للركاب.",
    total: "كل الأماكن", stops: "مواقف الحافلات", stations: "محطات المترو", active: "نشط", inactive: "غير نشط",
    byLine: "المحطات حسب الخط", recent: "أحدث التغييرات", quickLinks: "إجراءات الدليل"
  }
};
export default ar;
