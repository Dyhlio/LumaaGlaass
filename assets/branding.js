/* LumaaGlaass v1.1.0 - Jellyfin theme. */
/* LUMAAGLAASS:START v1 */
;(() => {
  'use strict';

    // Localization - Share access to Jellyfin's translator across independent scripts.
    const nativeI18n = window.__lumaaGlaassI18n ||= (() => {
        let translator = null, runtime = null, retryAt = 0;
        function resolve() {
            const exposed = window.globalize || window.Globalize;
            if (typeof exposed?.translate === 'function') return exposed;
            if (translator) return translator;
            if (Date.now() < retryAt) return null;
            retryAt = Date.now() + 5000;
            const chunks = window.webpackChunk;
            if (!runtime && Array.isArray(chunks) && chunks.push !== Array.prototype.push) {
                chunks.push([['lg-i18n-' + Date.now()], {}, value => { runtime = value; }]);
            }
            if (!runtime?.m) return null;
            const matches = Object.entries(runtime.m).filter(([, factory]) => {
                const source = String(factory);
                return source.includes('Translation dictionary is empty.') && source.includes('data-culture');
            });
            if (matches.length === 1) {
                translator = Object.values(runtime(matches[0][0])).find(value =>
                    value && typeof value.translate === 'function' && typeof value.getCurrentLocale === 'function');
            }
            return translator;
        }
        return {
            translate(key) {
                try {
                    const value = resolve()?.translate(key);
                    return typeof value === 'string' && value.trim() && value !== key ? value : null;
                } catch { return null; }
            }
        };
    })();
  const KEY = '__lumaaGlaass1011';
  // Localization - Native Jellyfin strings, selected by the client's document language.
  const translations = {
    "af": {"ItemDetails":"Item Informasie","ErrorDefault":"Daar was 'n probleem met die verwerking van die versoek. Probeer asseblief later weer."},
    "ar": {"Play":"قم بتشغيل","Movie":"فيلم","Series":"المسلسل","ItemDetails":"تفاصيل العنصر","MessagePleaseWait":"يرجى الانتظار.","ErrorDefault":"كان هناك خطأ في معالجة الطلب. الرجاء المحاولة لاحقاً.","MoviesAndShows":"الأفلام و المسلسلات التلفزيونية"},
    "as": {},
    "be-by": {"Play":"Прайграць","Movie":"Фільм","Series":"Серыял","ItemDetails":"Дэталі прадмета","MessagePleaseWait":"Калі ласка пачакайце. Гэта можа заняць хвіліну.","ErrorDefault":"Адбылася памылка апрацоўкі запыту. Калі ласка паспрабуйце зноў пазней.","MoviesAndShows":"Фільмы і Cерыялы"},
    "bg-bg": {"Play":"Пускане","Movie":"Филм","Series":"Сериал","ItemDetails":"Подробности за елемента","MessagePleaseWait":"Моля,изчакайте. Това може да отнеме минута.","ErrorDefault":"Възникна грешка при изпълнение на заявката. Моля опитайте по-късно.","MoviesAndShows":"Филми и Сериали"},
    "bn": {},
    "bn_bd": {"ErrorDefault":"অনুরোধটি প্রক্রিয়াতে একটি সমস্যা হয়েছে । অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।"},
    "br": {},
    "ca": {"Play":"Reprodueix","Movie":"Pel·lícula","Series":"Sèries","ItemDetails":"Detalls de l'element","MessagePleaseWait":"Espereu, si us plau. Pot trigar un minut.","ErrorDefault":"S'ha produït un error en processar la petició. Intenteu-ho més tard.","MoviesAndShows":"Pel·lícules i sèries"},
    "ch": {},
    "ckb": {},
    "cs": {"Play":"Přehrát","Movie":"Film","Series":"Seriály","ItemDetails":"Podrobnosti","MessagePleaseWait":"Prosím, čekejte. Může to trvat několik minut.","ErrorDefault":"Došlo k chybě při zpracování požadavku. Prosím zkuste to znovu později.","MoviesAndShows":"Filmy a seriály"},
    "cy": {"Play":"Chwarae","Movie":"Ffilm","Series":"Cyfres"},
    "da": {"Play":"Afspil","Movie":"Film","Series":"Serier","ItemDetails":"Element detaljer","MessagePleaseWait":"Vent venligst. Dette kan tage et par minutter.","ErrorDefault":"Det opstod en fejl ved behandlingen af forespørgslen. Prøv igen senere.","MoviesAndShows":"Film og TV-serier"},
    "de": {"Play":"Abspielen","Movie":"Film","Series":"Serien","ItemDetails":"Details","MessagePleaseWait":"Bitte warten, dies kann eine Minute dauern.","ErrorDefault":"Fehler beim Verarbeiten der Anfrage. Bitte versuche es später erneut.","MoviesAndShows":"Filme und Serien"},
    "dv": {},
    "el": {"Play":"Αναπαραγωγή","Movie":"Ταινία","Series":"Πρόγραμμα","ItemDetails":"Λεπτομέρειες αντικειμένου","MessagePleaseWait":"Παρακαλώ περιμένετε. Αυτό μπορεί να πάρει ένα λεπτό.","ErrorDefault":"Παρουσιάστηκε σφάλμα κατά την επεξεργασία του αιτήματός σας. Παρακαλώ δοκιμάστε ξανά αργότερα.","MoviesAndShows":"Ταινίες και Σειρές"},
    "en-gb": {"Play":"Play","Movie":"Film","Series":"Programme","ItemDetails":"Item Details","MessagePleaseWait":"Please wait. This may take a minute.","ErrorDefault":"There was an error processing the request. Please try again later.","MoviesAndShows":"Films and Programmes"},
    "en-us": {"Play":"Play","Movie":"Movie","Series":"Series","ItemDetails":"Item Details","MessagePleaseWait":"Please wait. This may take a minute.","ErrorDefault":"There was an error processing the request. Please try again later.","MoviesAndShows":"Movies and Shows"},
    "enm": {},
    "eo": {"Play":"Ludu","Movie":"Filmo","Series":"Serio","ItemDetails":"Aĵa Detaloj","MessagePleaseWait":"Atendi. Ĉi tio eble daŭros minuton.","ErrorDefault":"Estis eraro proceze la peton. Provi denove."},
    "es-ar": {"Play":"Reproducir","Movie":"Película","Series":"Serie","ItemDetails":"Detalles del elemento","MessagePleaseWait":"Por favor esperá. Esto puede tardar un minuto.","ErrorDefault":"Hubo un error procesando la solicitud. Por favor probá de nuevo mas tarde.","MoviesAndShows":"Películas y programas"},
    "es-mx": {"Play":"Reproducir","Movie":"Película","Series":"Series","ItemDetails":"Detalles del elemento","MessagePleaseWait":"Por favor, espera. Esto podría tomar un minuto.","ErrorDefault":"Ha ocurrido un error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde.","MoviesAndShows":"Películas y Series"},
    "es": {"Play":"Reproducir","Movie":"Película","Series":"Series","ItemDetails":"Detalles del objeto","MessagePleaseWait":"Por favor, espere.","ErrorDefault":"Ha habido un error procesando la solicitud. Por favor inténtalo más tarde.","MoviesAndShows":"Películas y Programas"},
    "es_419": {"Play":"Reproducir","Movie":"Película","Series":"Series","ItemDetails":"Detalles de elemento","MessagePleaseWait":"Por favor, espera. Esto podría tomar un minuto.","ErrorDefault":"Ha ocurrido un error al procesar la solicitud. Por favor, inténtalo de nuevo más tarde."},
    "es_do": {},
    "et": {"Play":"Esita","Movie":"Film","Series":"Sarjad","ItemDetails":"Elemendi üksikasjad","MessagePleaseWait":"Palun oota. See võib veidi aega võtta.","ErrorDefault":"Taotluse töötlemisel ilmnes viga. Palun proovi hiljem uuesti.","MoviesAndShows":"Filmid ja Sarjad"},
    "eu": {"Play":"Erreproduzitu","Movie":"Filma","Series":"Serieak","ItemDetails":"Xehetasunak","MessagePleaseWait":"Mesedez, itxaron.","ErrorDefault":"Errorea gertatu da eskaera prozesatzean. Mesedez, saiatu geroago.","MoviesAndShows":"Filmak eta serieak"},
    "fa": {"Play":"اجرا کردن","Movie":"فیلم","Series":"سریال ها","ItemDetails":"جزئیات مورد","MessagePleaseWait":"لطفا صبر کنید. این ممکن است چند دقیقه طول بکشد.","ErrorDefault":"خطایی در پردازش درخواست رخ داد. لطفا اندکی بعد دوباره تلاش کنید."},
    "fi": {"Play":"Toista","Movie":"Elokuva","Series":"Sarjat","ItemDetails":"Kohteen tiedot","MessagePleaseWait":"Ole hyvä ja odota. Tämä voi kestää hetken.","ErrorDefault":"Käsiteltäessä pyyntöä tapahtui virhe. Yritä myöhemmin uudelleen.","MoviesAndShows":"Elokuvat ja sarjat"},
    "fil": {"Play":"I-play","Movie":"Pelikula","Series":"Serye","ItemDetails":"Detalye ng mga item","MessagePleaseWait":"Mangyaring maghintay. Maaaring tumagal ito ng isang minuto.","ErrorDefault":"Nagkaroon ng error sa pagproseso ng kahilingan. Subukang muli mamaya."},
    "fo": {"Series":"Røð"},
    "fr-ca": {"Play":"Lire","Movie":"Film","Series":"Séries","ItemDetails":"Détails de L'article","MessagePleaseWait":"Attendez. Ça peut prendre quelques minutes.","ErrorDefault":"Il y a eu une erreur lors du traitement de la demande. Veuillez réessayer plus tard.","MoviesAndShows":"Films et émissions télé"},
    "fr": {"Play":"Lire","Movie":"Film","Series":"Séries","ItemDetails":"Détails de l'élément","MessagePleaseWait":"Veuillez patienter. Ceci peut prendre quelques minutes.","ErrorDefault":"Il y a eu une erreur lors de l'exécution de la requête. Veuillez réessayer plus tard.","MoviesAndShows":"Films et Séries"},
    "ga": {"Play":"Seinn","Movie":"Scannán","Series":"Sraith","ItemDetails":"Sonraí na Míre","MessagePleaseWait":"Fan, le do thoil. B'fhéidir go dtógfaidh sé seo nóiméad.","ErrorDefault":"Tharla earráid agus an t-iarratas á phróiseáil. Bain triail eile as níos déanaí.","MoviesAndShows":"Scannáin agus Seónna"},
    "gl": {"Play":"Reproducir","Movie":"Filme","Series":"Series","MessagePleaseWait":"Por favor espere. Isto pode tomar un minuto.","ErrorDefault":"Houbo un erro durante o procesamento da petición. Por favor, probe máis tarde."},
    "gsw": {"Play":"Abspile"},
    "gu": {},
    "he": {"Play":"נגן","Movie":"סרט","Series":"סדרה","ItemDetails":"פרטי פריט","MessagePleaseWait":"נא להמתין. זה יכול לקחת דקה.","ErrorDefault":"אירעה שגיאה בעיבוד הבקשה. בבקשה נסה שוב מאוחר יותר.","MoviesAndShows":"סרטים וסדרות"},
    "hi-in": {},
    "hr": {"Play":"Pokreni","Movie":"Film","Series":"Serija","ItemDetails":"Detalji stavke","MessagePleaseWait":"Molimo pričekajte. Ovo može potrajati nekoliko minuta.","ErrorDefault":"Došlo je do pogreške prilikom obrade zahtjeva. Molimo pokušajte ponovo kasnije."},
    "ht": {},
    "hu": {"Play":"Lejátszás","Movie":"Film","Series":"Sorozatok","ItemDetails":"Elem részletei","MessagePleaseWait":"Kérlek várj. Ez eltarthat egy percet.","ErrorDefault":"Hiba történt a kérés feldolgozása során. Kérlek próbáld újra később.","MoviesAndShows":"Filmek és Sorozatok"},
    "hy": {},
    "id": {"Play":"Putar","Movie":"Film","Series":"Seri","ItemDetails":"Detail Barang","MessagePleaseWait":"Mohon tunggu. Ini membutuhkan beberapa saat.","ErrorDefault":"Terdapat galat dalam memproses permintaan. Silakan coba kembali nanti.","MoviesAndShows":"Film dan Serial"},
    "is-is": {"Play":"Spila","Series":"Seríur","ErrorDefault":"Villa varð við vinnslu beiðninnar. Reyndu aftur síðar."},
    "it": {"Play":"Riproduci","Movie":"Film","Series":"Serie TV","ItemDetails":"Dettagli Titolo","MessagePleaseWait":"Per favore attendi. La procedura potrebbe impiegare qualche minuto.","ErrorDefault":"Si è verificato un errore durante l'elaborazione della richiesta. Si prega di riprovare più tardi.","MoviesAndShows":"Film e Serie"},
    "ja": {"Play":"再生","Movie":"ムービー","Series":"シリーズ","ItemDetails":"アイテム詳細","MessagePleaseWait":"お待ち下さい。この処理には数分かかります。","ErrorDefault":"要求の処理中にエラーが発生しました。 後でもう一度やり直してください。","MoviesAndShows":"映画・番組"},
    "jbo": {},
    "ka": {},
    "kab": {},
    "kk": {"Play":"Oinatu","Movie":"Film","Series":"Telehikaia","ItemDetails":"Tarmaq egjeilerı","MessagePleaseWait":"Küte tūryñyz. Būl minöt aluy mümkın.","ErrorDefault":"Saual öñdelu kezınde qate oryn aldy. Ärekettı keiın qaitalañyz."},
    "kn": {},
    "ko": {"Play":"재생","Movie":"영화","Series":"시리즈","ItemDetails":"항목 상세 정보","MessagePleaseWait":"기다려주십시오. 1분 정도 걸릴 수 있습니다.","ErrorDefault":"요청을 처리하는 중에 오류가 발생했습니다. 나중에 다시 시도하십시오.","MoviesAndShows":"영화 및 쇼"},
    "kw": {},
    "ky": {},
    "lb": {"Play":"Spillen","Movie":"Film","Series":"Série","ItemDetails":"Item-Detailer","MessagePleaseWait":"Waart wannechgelift...","ErrorDefault":"Allgemeine Feeler","MoviesAndShows":"Filmer & Serien"},
    "lt-lt": {"Play":"Leisti","Movie":"Filmas","Series":"Serijos","ItemDetails":"Elemento detalės","MessagePleaseWait":"Palaukite. Tai gali užtrukti minutę.","ErrorDefault":"Įvyko klaida vykdant užklausą. Pabandykite vėliau.","MoviesAndShows":"Filmai ir laidos"},
    "lv": {"Play":"Atskaņot","Movie":"Filma","Series":"Seriāli","ItemDetails":"Sīkāka Informācija vienumu","MessagePleaseWait":"Lūdzu, uzgaidiet. Tas var aizņemt pāris minūtes.","ErrorDefault":"Pieprasījuma apstrādē ir notikusi kļūda. Lūdzu, mēģiniet vēlreiz vēlāk.","MoviesAndShows":"Filmas un seriāli"},
    "mg": {},
    "mk": {"ErrorDefault":"Настана грешка при обработката на барањето. Обидете се повторно подоцна."},
    "ml": {"Play":"പ്ലേ ചെയ്യുക","Movie":"സിനിമ","Series":"സീരീസ്","MessagePleaseWait":"കാത്തിരിക്കൂ. ഇതിന് ഒരു മിനിറ്റ് എടുത്തേക്കാം.","ErrorDefault":"അഭ്യർത്ഥന പ്രോസസ്സ് ചെയ്യുന്നതിൽ ഒരു പിശക് ഉണ്ടായിരുന്നു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക."},
    "mn": {"Play":"Тоглуулах","Movie":"Кино","Series":"Цуврал","ItemDetails":"Зүйлийн дэлгэрэнгүй","MessagePleaseWait":"Түр хүлээнэ үү. Энэ нь хэдэн секунд шаардаж магадгүй.","ErrorDefault":"Хүсэлтийг боловсруулахад алдаа гарлаа. Дараа дахин оролдоно уу.","MoviesAndShows":"Кино ба Шоу"},
    "mr": {"Play":"प्ले","Movie":"चित्रपट","Series":"मालिका","ItemDetails":"वस्तू तपशील"},
    "ms": {},
    "mt": {},
    "my": {},
    "nb": {"Play":"Spill av","Movie":"Film","Series":"Serier","ItemDetails":"Detaljer om element","MessagePleaseWait":"Vennligst vent. Dette kan ta noe tid.","ErrorDefault":"Det oppstod en feil under behandling av forespørselen. Vennligst prøv igjen senere.","MoviesAndShows":"Filmer og serier"},
    "ne": {},
    "nl": {"Play":"Afspelen","Movie":"Film","Series":"Series","ItemDetails":"Itemdetails","MessagePleaseWait":"Even geduld. Dit kan even duren.","ErrorDefault":"Er is een fout opgetreden. Probeer het later opnieuw.","MoviesAndShows":"Films en series"},
    "nn": {"Play":"Spel av","Movie":"Film","Series":"Seriar","ErrorDefault":"Det oppstod ein feil under behandling av førespurnaden. Ver vennleg og prøv igjen seinare."},
    "pa": {},
    "pl": {"Play":"Odtwarzaj","Movie":"Film","Series":"Seriale","ItemDetails":"Szczegóły pozycji","MessagePleaseWait":"Proszę czekać. To może potrwać chwilę.","ErrorDefault":"Wystąpił błąd podczas przetwarzania żądania. Proszę spróbować ponownie później.","MoviesAndShows":"Filmy i seriale"},
    "pr": {},
    "pt-br": {"Play":"Reproduzir","Movie":"Filme","Series":"Séries","ItemDetails":"Detalhes do item","MessagePleaseWait":"Por favor, aguarde. Isto pode demorar um pouco.","ErrorDefault":"Ocorreu um erro ao processar o requisito. Por favor, tente novamente mais tarde.","MoviesAndShows":"Filmes e Séries"},
    "pt-pt": {"Play":"Reproduzir","Movie":"Filme","Series":"Séries","ItemDetails":"Detalhes","MessagePleaseWait":"Por favor, aguarde. Esta operação poderá demorar alguns instantes.","ErrorDefault":"Ocorreu um erro ao processar o pedido. Por favor, tente novamente mais tarde.","MoviesAndShows":"Filmes e séries"},
    "pt": {"Play":"Reproduzir","Movie":"Filme","Series":"Séries","ItemDetails":"Detalhe do item","MessagePleaseWait":"Por favor, espere. Isso pode levar um minuto.","ErrorDefault":"Ocorreu um erro ao processar o pedido. Por favor, tente novamente mais tarde.","MoviesAndShows":"Filmes e séries"},
    "ro": {"Play":"Rulează","Movie":"Film","Series":"Serial","ItemDetails":"Detalii articol","MessagePleaseWait":"Te rog așteaptă. Poate dura un minut.","ErrorDefault":"A fost o eroare în procesarea cererii. Vă rugam încercați din nou mai târziu.","MoviesAndShows":"Filme și seriale"},
    "ru": {"Play":"Воспроизвести","Movie":"Фильм","Series":"Сериал","ItemDetails":"Подробности элемента","MessagePleaseWait":"Подождите. Это может занять минуту.","ErrorDefault":"Произошла ошибка при обработке запроса. Повторите попытку позже.","MoviesAndShows":"Фильмы и Сериалы"},
    "si": {},
    "sk": {"Play":"Prehrať","Movie":"Film","Series":"Seriály","ItemDetails":"Podrobnosti položky","MessagePleaseWait":"Prosím, čakajte. Toto môže chvíľu trvať.","ErrorDefault":"Pri spracovaní požiadavky došlo k chybe. Prosím, skúste to neskôr znova.","MoviesAndShows":"Filmy a seriály"},
    "sl-si": {"Play":"Predvajaj","Movie":"Film","Series":"Serija","ItemDetails":"Podrobnosti elementa","MessagePleaseWait":"Prosimo, počakajte. To lahko traja nekaj minut.","ErrorDefault":"Prišlo je do težave pri obdelavi zahteve. Poskusite ponovno kasneje.","MoviesAndShows":"Filmi in Oddaje"},
    "so": {},
    "sq": {"ItemDetails":"Detajet e artikullit","ErrorDefault":"Ndodhi një problem gjatë procesimit të kërkesës. Ju lutem provojeni përseri."},
    "sr": {"Play":"Репродукуј","Movie":"Филм","Series":"Серија","ItemDetails":"Детаљи ставки","MessagePleaseWait":"Сачекајте. Ово може потрајати минут.","ErrorDefault":"Десила се грешка приликом обраде захтева. Молимо покушајте касније.","MoviesAndShows":"Филмови и серије"},
    "sv": {"Play":"Spela upp","Movie":"Film","Series":"Serier","ItemDetails":"Detaljer","MessagePleaseWait":"Vänligen vänta. Detta kan ta ett tag.","ErrorDefault":"Ett fel uppstod vid förfrågningsprocessen. Försök igen senare.","MoviesAndShows":"Filmer och Serier"},
    "ta": {"Play":"வாசிக்கவும்","Movie":"திரைப்படம்","Series":"தொடர்","ItemDetails":"பொருள் விவரங்கள்","MessagePleaseWait":"தயவுசெய்து காத்திருங்கள். இதற்கு ஒரு நிமிடம் ஆகலாம்.","ErrorDefault":"கோரிக்கையை செயலாக்குவதில் பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.","MoviesAndShows":"திரைப்படங்கள் மற்றும் நிகழ்ச்சிகள்"},
    "te": {"Play":"ప్లే","Movie":"సినిమా","Series":"సిరీస్","ItemDetails":"వస్తువు వివరాలు","MessagePleaseWait":"దయచేసి వేచి ఉండండి. దీనికి ఒక నిమిషం పట్టవచ్చు.","ErrorDefault":"అభ్యర్థనను ప్రాసెస్ చేయడంలో లోపం ఉంది. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.","MoviesAndShows":"సినిమాలు మరియు షోలు"},
    "th": {},
    "tr": {"Play":"Oynat","Movie":"Film","Series":"Diziler","ItemDetails":"Öge Ayrıntıları","MessagePleaseWait":"Lütfen bekleyin. Biraz zaman alabilir.","ErrorDefault":"İsteğiniz gerçekleştirilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.","MoviesAndShows":"Filmler ve Diziler"},
    "ug": {},
    "uk": {"Play":"Грати","Movie":"Фільми","Series":"Серіал","ItemDetails":"Деталі медіафайлу","MessagePleaseWait":"Будь ласка, зачекайте. Це може зайняти деякий час...","ErrorDefault":"Виникла помилка при обробці запиту. Будь-ласка, повторіть пізніше.","MoviesAndShows":"Фільми та серіали"},
    "ur_pk": {"Play":"پلے کریں","Movie":"فلم","Series":"سلسلہ","ItemDetails":"آئٹم کی تفصیلات","MessagePleaseWait":"برائے مہربانی انتظار کریں. اس میں ایک منٹ لگ سکتا ہے۔","ErrorDefault":"درخواست پر کارروائی کرنے میں ایک خامی تھی۔ براہ کرم کچھ دیر بعد کوشش کریں.","MoviesAndShows":"فلمیں اور شوز"},
    "uz": {"ItemDetails":"Element tafsilotlari","ErrorDefault":"So‘rovni qayta ishlashda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring."},
    "vi": {"Play":"Phát","Movie":"Phim","Series":"Loạt Phim","ItemDetails":"Chi Tiết Mục","MessagePleaseWait":"Vui lòng đợi. Việc này có thể phải mất một ít thời gian.","ErrorDefault":"Đã xảy ra lỗi khi xử lý yêu cầu. Xin hãy thử lại sau.","MoviesAndShows":"Phim và Chương trình"},
    "zh-cn": {"Play":"播放","Movie":"电影","Series":"电视节目","ItemDetails":"项目详情","MessagePleaseWait":"请稍等。这将花费大约1分钟的时间。","ErrorDefault":"处理请求时发生错误。请稍后尝试。","MoviesAndShows":"电影和节目"},
    "zh-hk": {"Play":"播放","Movie":"電影","Series":"系列","ItemDetails":"項目詳細資料","MessagePleaseWait":"請稍等。","ErrorDefault":"處理此指令時發生錯誤，請稍後再試。","MoviesAndShows":"電影及節目"},
    "zh-tw": {"Play":"播放","Movie":"電影","Series":"電視劇","ItemDetails":"詳情","MessagePleaseWait":"請稍候。","ErrorDefault":"處理請求時發生錯誤。請稍後再試。","MoviesAndShows":"電影和節目"},
    "zu": {}
  };
  const locale = () => (document.documentElement.lang || document.documentElement.getAttribute('data-culture') || navigator.language || 'en-us').replace(/_/g, '-').toLowerCase();
  const translate = key => {
    const language = locale();
    const native = nativeI18n;
    try {
      const value = native?.translate?.(key);
      if (typeof value === 'string' && value && value !== key) return value;
    } catch { /* Localization - Use bundled native strings when the client API is unavailable. */ }
    return translations[language]?.[key] || translations[language.split('-')[0]]?.[key] || translations['en-us'][key] || key;
  };
  window.__kinemaRemux1011?.stop();
  window[KEY]?.stop();
  // Configuration - Carousel item limit and interval between slides.
  const MAX = 8, INTERVAL = 9000;
  let elapsed = 0, lastTick = 0, frame = 0, wasRunning = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let hero = null, items = [], client = null, identity = '', index = 0;
  let lastBackgroundArt = '', lastBackgroundKey = '';
  let backgroundRequest = null;
  let stopped = false, loading = false, retryAt = 0, generation = 0;
  let hovered = false, focused = false, touching = false, pending = null;
  let action = 0, scheduled = 0, lastError = '';
  const listeners = [], viewIds = new WeakMap();
  const listen = (target, event, fn, options) => {
    target.addEventListener(event, fn, options);
    listeners.push(() => target.removeEventListener(event, fn, options));
  };
  const element = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const route = () => location.hash.split('?')[0].replace(/\.html$/, '');
  const home = () => route() === '#/home';
  const enabled = () => getComputedStyle(document.documentElement).getPropertyValue('--aa-accent').trim() !== '';
  const currentClient = () => {
    try { return window.ApiClient || window.ConnectionManager?.currentApiClient?.(); }
    catch { return null; }
  };
  const sessionKey = c => {
    try { const u = c?.getCurrentUserId?.(); return u ? String(c.serverId?.() || '') + ':' + u : ''; }
    catch { return ''; }
  };
  const params = () => new URLSearchParams(location.hash.split('?')[1] || '');
  const sameId = (a, b) => String(a || '').replace(/-/g, '').toLowerCase() === String(b || '').replace(/-/g, '').toLowerCase();
  const details = item => {
    const q = new URLSearchParams({ id: item.Id });
    const server = client?.serverId?.();
    if (server) q.set('serverId', server);
    return '#/details?' + q;
  };
  const visible = n => n && !n.closest('.hide,[hidden]') && n.getClientRects().length > 0;
  const backdrop = item => {
    const id = item.BackdropImageTags?.length ? item.Id : item.ParentBackdropItemId;
    const tag = item.BackdropImageTags?.[0] || item.ParentBackdropImageTags?.[0];
    if (!id || !tag) return '';
    try { return client.getUrl('Items/' + encodeURIComponent(id) + '/Images/Backdrop/0', { tag, maxWidth: 1920, quality: 90 }); }
    catch { return ''; }
  };
  function removeHero() {
    hero?.remove(); hero = null;
    document.documentElement.classList.remove('aa-home-art');
    document.documentElement.style.removeProperty('--aa-art');
    hovered = focused = touching = false;
  }
  // Backgrounds - Keep only loaded artwork from the currently visible view.
  // Memory is session-scoped; late image loads must never replace a newer view.
  function rememberBackground(art, key, page) {
    if (stopped || !enabled() || !key || key !== sessionKey(currentClient()) || !visible(page)) return;
    const match = /^url\(["']?(.*?)["']?\)$/.exec(art || '');
    if (!match || !match[1]) return;
    if (art === lastBackgroundArt && key === lastBackgroundKey) {
      if (backgroundRequest && backgroundRequest.art !== art) {
        backgroundRequest.image.onload = backgroundRequest.image.onerror = null;
        backgroundRequest = null;
      }
      return;
    }
    const hash = location.hash;
    if (backgroundRequest?.art === art && backgroundRequest.key === key && backgroundRequest.page === page && backgroundRequest.hash === hash) return;
    if (backgroundRequest) backgroundRequest.image.onload = backgroundRequest.image.onerror = null;
    const image = new Image(), request = { art, key, page, hash, image };
    backgroundRequest = request;
    image.onload = () => {
      image.onload = image.onerror = null;
      if (backgroundRequest !== request || stopped || !enabled() || !image.naturalWidth ||
          key !== sessionKey(currentClient()) || location.hash !== hash || !visible(page)) return;
      lastBackgroundArt = art; lastBackgroundKey = key;
    };
    // Retain a failed candidate until the view or URL changes; do not poll-fetch it.
    image.onerror = () => { image.onload = image.onerror = null; };
    image.src = match[1];
  }
  // Backgrounds - Reuse the last valid artwork on neutral pages in this session.
  function syncSearchArt() {
    const root = document.documentElement, key = sessionKey(currentClient());
    if (!enabled() || !key || (lastBackgroundKey && key !== lastBackgroundKey)) {
      lastBackgroundArt = ''; lastBackgroundKey = '';
      if (backgroundRequest) backgroundRequest.image.onload = backgroundRequest.image.onerror = null;
      backgroundRequest = null;
    }
    const currentRoute = route();
    const page = [...document.querySelectorAll('.page')].find(visible);
    // Match whole route segments, not preference names containing "home" or "playback".
    const excluded = /^#\/(?:home|details|video|playback|queue|login|signin|wizard|setup)(?:\/|$)/i.test(currentRoute);
    const hasOwnArt = page && (page.matches('.itemDetailPage,.aa-collection-page,.aa-library-page') ||
      [...page.querySelectorAll('.itemBackdrop')].some(visible));
    // Loading routes may have no visible page. Keep the state boolean so the
    // class observer settles instead of repeatedly toggling an absent class.
    const eligible = currentRoute === '#/search' || Boolean(page && !excluded && !hasOwnArt);
    const active = !stopped && eligible && !!lastBackgroundArt && key === lastBackgroundKey;
    if (root.classList.contains('aa-search-art') !== active) root.classList.toggle('aa-search-art', active);
    if (active) {
      if (root.style.getPropertyValue('--aa-search-art') !== lastBackgroundArt) root.style.setProperty('--aa-search-art', lastBackgroundArt);
    } else root.style.removeProperty('--aa-search-art');
  }
  function setStatus(key) {
    const n = hero?.querySelector('.aa-hero-status');
    if (n) { n.dataset.translation = key; n.textContent = key ? translate(key) : ''; n.hidden = !key; }
  }
  function consumePlay() {
    if (!pending) return;
    if (Date.now() > pending.until || !enabled() || sessionKey(currentClient()) !== pending.key ||
        route() !== '#/details' || !sameId(params().get('id'), pending.id)) {
      pending = null; return;
    }
    // Playback - Trigger playback only from the visible details page matching the request.
    const page = [...document.querySelectorAll('.itemDetailPage')].find(n => visible(n) && sameId(viewIds.get(n), pending.id));
    if (!page) return;
    if (page.querySelector('.remux-no-streams')) { pending = null; return; }
    const button = page.querySelector('.mainDetailButtons .btnPlay, .detailPagePrimaryContainer .btnPlay');
    const ready = page.matches('.remux-streams-ready') || page.querySelector('.remux-streams-ready') || button?.closest('.remux-streams-ready');
    // Playback - Respect Remux readiness, disabled controls and the native player.
    if (!ready || !visible(button) || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    pending = null;
    button.click();
  }
  // Playback - Prepare native details; select the next episode for a series.
  async function play(item, button) {
    if (button.disabled) return;
    const attempt = ++action, key = identity, api = client, user = api.getCurrentUserId();
    const initialRoute = location.hash;
    button.disabled = true; button.setAttribute('aria-busy', 'true'); setStatus('MessagePleaseWait');
    try {
      let target = item;
      if (item.Type === 'Series') {
        const next = await api.getNextUpEpisodes({ UserId: user, SeriesId: item.Id, Limit: 1 });
        target = next?.Items?.[0];
        if (!target) {
          if (!stopped && attempt === action && key === sessionKey(currentClient()) && location.hash === initialRoute) location.hash = details(item);
          return;
        }
      }
      if (stopped || attempt !== action || key !== sessionKey(currentClient()) || location.hash !== initialRoute) return;
      pending = { id: target.Id, key, until: Date.now() + 45000 };
      location.hash = details(target);
    } catch {
      setStatus('ErrorDefault');
    } finally {
      button.disabled = false; button.removeAttribute('aria-busy');
      if (pending) setStatus('');
    }
  }
  // Carousel - Update the image, labels, links and indicators together.
  function render(next) {
    if (!hero || !items.length) return;
    elapsed = 0; lastTick = performance.now(); wasRunning = false;
    index = (next + items.length) % items.length;
    const item = items[index];
    const art = 'url(' + JSON.stringify(backdrop(item)) + ')';
    document.documentElement.style.setProperty('--aa-art', art);
    rememberBackground(art, identity, hero);
    document.documentElement.classList.add('aa-home-art');
    hero.querySelectorAll('.aa-hero-backdrops > div').forEach((n, i) => n.classList.toggle('aa-active', i === index));
    hero.querySelectorAll('.aa-hero-dot').forEach((n, i) => {
      n.classList.toggle('aa-active', i === index); n.setAttribute('aria-current', String(i === index));
    });
    const title = hero.querySelector('.aa-hero-title a');
    title.textContent = item.Name; title.href = details(item);
    hero.querySelector('.aa-hero-kicker').textContent = translate(item.Type === 'Series' ? 'Series' : 'Movie');
    const meta = [item.ProductionYear, item.CommunityRating ? '★ ' + Number(item.CommunityRating).toFixed(1) : '', item.OfficialRating, item.Genres?.[0]].filter(Boolean);
    hero.querySelector('.aa-hero-meta').textContent = meta.join(' · ');
    hero.querySelector('.aa-hero-overview').textContent = item.Overview || '';
    hero.querySelector('.aa-hero-btn-info').href = details(item);
    const button = hero.querySelector('.aa-hero-btn-play');
    button.onclick = () => play(item, button);
    setStatus('');
  }
  // Carousel - Build the banner and controls without modifying the native player.
  function build() {
    hero = element('section', 'aa-hero');
    hero.id = 'lumaaGlaassHero'; hero.setAttribute('aria-label', translate('MoviesAndShows'));
    const backgrounds = element('div', 'aa-hero-backdrops');
    backgrounds.setAttribute('aria-hidden', 'true');
    for (const item of items) {
      const slide = element('div');
      slide.style.backgroundImage = 'url(' + JSON.stringify(backdrop(item)) + ')';
      backgrounds.append(slide);
    }
    const inner = element('div', 'aa-hero-inner'), title = element('h1', 'aa-hero-title');
    title.append(element('a'));
    inner.append(element('div', 'aa-hero-kicker'), title, element('div', 'aa-hero-meta'), element('p', 'aa-hero-overview'));
    const actions = element('div', 'aa-hero-actions');
    const playButton = element('button', 'aa-hero-btn aa-hero-btn-play', translate('Play'));
    playButton.type = 'button';
    const infoButton = element('a', 'aa-hero-btn aa-hero-btn-info');
    const infoIcon = element('span', 'material-icons info');
    infoIcon.setAttribute('aria-hidden', 'true');
    infoButton.append(infoIcon);
    infoButton.setAttribute('aria-label', translate('ItemDetails'));
    infoButton.title = translate('ItemDetails');
    actions.append(playButton, infoButton);
    inner.append(actions);
    const controls = element('div', 'aa-hero-controls'), dots = element('div', 'aa-hero-dots');
    items.forEach((item, i) => {
      const button = element('button', 'aa-hero-dot');
      button.type = 'button'; button.setAttribute('aria-label', item.Name);
      button.onclick = () => render(i); dots.append(button);
    });
    controls.append(dots);
    const status = element('p', 'aa-hero-status'); status.setAttribute('role', 'status'); status.hidden = true;
    hero.append(backgrounds, element('div', 'aa-hero-scrim'), inner, controls, status);
    hero.onmouseenter = () => { hovered = true; };
    hero.onmouseleave = () => { hovered = false; };
    hero.onfocusin = () => { focused = true; };
    hero.onfocusout = e => { focused = hero?.contains(e.relatedTarget) || false; };
    // Gestures - Isolate touch events to prevent switching Jellyfin tabs.
    // Passive listeners preserve native scrolling and zoom.
    for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
      hero.addEventListener(type, e => e.stopPropagation(), {passive:true});
    }
    // Gestures - Pointer Events drive slides; pan-y preserves vertical scrolling.
    // Listeners belong to the banner and disappear when it is removed.
    let gesture = null, suppressClickUntil = 0;
    hero.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      if (!e.isPrimary) { gesture = null; touching = false; return; }
      suppressClickUntil = 0;
      if (items.length < 2) return;
      gesture = { id:e.pointerId, x:e.clientX, y:e.clientY };
      touching = true;
    }, {passive:true});
    hero.addEventListener('pointermove', e => {
      if (!gesture || gesture.id !== e.pointerId) return;
      const dx = Math.abs(e.clientX - gesture.x), dy = Math.abs(e.clientY - gesture.y);
      if (dy > 12 && dy > dx) { gesture = null; touching = false; }
    }, {passive:true});
    hero.addEventListener('pointerup', e => {
      if (!gesture || gesture.id !== e.pointerId) return;
      const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
      gesture = null; touching = false;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      suppressClickUntil = performance.now() + 700;
      render(index + (dx < 0 ? 1 : -1));
    }, {passive:true});
    hero.addEventListener('pointercancel', () => { gesture = null; touching = false; }, {passive:true});
    hero.addEventListener('click', e => {
      // Gestures - Prevent a swipe from subsequently triggering playback or details navigation.
      if (e.detail !== 0 && performance.now() < suppressClickUntil) {
        e.preventDefault(); e.stopImmediatePropagation(); suppressClickUntil = 0;
      }
    }, true);
    return hero;
  }
  // Collections - Keep the background during the visit and ignore stale responses.
  let collectionScene = null;
  // Backdrops - Library lists use parentId; collection details use id.
  function collectionArtContext() {
    if (route() === '#/list') {
      const id = params().get('parentId');
      const page = id && [...document.querySelectorAll('.libraryPage')].find(node =>
        visible(node) && node.querySelector('.itemsViewSettingsContainer'));
      return page ? { page, id, kind: 'library', className: 'aa-library-page' } : null;
    }
    if (route() !== '#/details') return null;
    const id = params().get('id');
    const page = id && [...document.querySelectorAll('.itemDetailPage')].find(node =>
      visible(node) && node.querySelector('.collectionItems:not(.hide):not([hidden])'));
    return page ? { page, id, kind: 'collection', className: 'aa-collection-page' } : null;
  }
  function clearCollection() {
    collectionScene?.cancelImage?.(); collectionScene = null;
    document.querySelectorAll('.aa-collection-page,.aa-library-page').forEach(n => { n.classList.remove('aa-collection-page', 'aa-library-page'); n.style.removeProperty('--aa-collection-art'); });
    if(document.documentElement.classList.contains('aa-collection-art')) document.documentElement.classList.remove('aa-collection-art');
    document.documentElement.style.removeProperty('--aa-collection-art');
  }
  function syncCollection() {
    const context = collectionArtContext();
    if (!context) { clearCollection(); return; }
    const { page, id, kind, className } = context;
    document.querySelectorAll('.aa-collection-page,.aa-library-page').forEach(n => { if(n !== page) { n.classList.remove('aa-collection-page', 'aa-library-page'); n.style.removeProperty('--aa-collection-art'); } });
    const otherClass = kind === 'library' ? 'aa-collection-page' : 'aa-library-page';
    if(page.classList.contains(otherClass)) page.classList.remove(otherClass);
    if(!page.classList.contains(className)) page.classList.add(className);
    const api = currentClient(), key = sessionKey(api);
    if (!id || !key) { clearCollection(); return; }
    if (!collectionScene || collectionScene.id !== id || collectionScene.key !== key || collectionScene.kind !== kind || collectionScene.page !== page) {
      collectionScene?.cancelImage?.();
      collectionScene = {id,key,kind,page,art:'none',loading:false,retry:0};
    }
    const scene = collectionScene, art = scene.art;
    rememberBackground(art, key, page);
    for(const node of [page, document.documentElement]) if(node.style.getPropertyValue('--aa-collection-art') !== art) node.style.setProperty('--aa-collection-art',art);
    if(!document.documentElement.classList.contains('aa-collection-art')) document.documentElement.classList.add('aa-collection-art');
    if (!scene.loading && scene.art === 'none' && Date.now() >= scene.retry && typeof api.getItems === 'function') void loadCollectionScene(scene, api, page);
  }
  async function loadCollectionScene(scene, api, page) {
    scene.loading = true;
    const current = () => {
      const context = collectionArtContext();
      return !stopped && enabled() && collectionScene === scene && context?.page === page &&
        context.id === scene.id && context.kind === scene.kind && sessionKey(currentClient()) === scene.key;
    };
    try {
      // Backdrops - Restrict image selection to the open collection or library.
      const result = await api.getItems(api.getCurrentUserId(), {
        ParentId:scene.id, IncludeItemTypes:'Movie,Series', Recursive:true, SortBy:'Random', Limit:30,
        Fields:'BackdropImageTags,ParentBackdropImageTags,ParentBackdropItemId', EnableImages:true, ImageTypes:'Backdrop'
      });
      if (!current()) return;
      const candidates = (result?.Items || []).filter(item => ['Movie','Series'].includes(item.Type) &&
        (item.BackdropImageTags?.length || item.ParentBackdropImageTags?.length));
      // Collections - Use server-provided random ordering and verify image loading.
      for (const item of candidates.slice(0,4)) {
        if (!current()) return;
        const imageId = item.BackdropImageTags?.length ? item.Id : item.ParentBackdropItemId;
        const tag = item.BackdropImageTags?.[0] || item.ParentBackdropImageTags?.[0];
        if (!imageId || !tag) continue;
        const url = api.getUrl('Items/'+encodeURIComponent(imageId)+'/Images/Backdrop/0', {tag,maxWidth:1920,quality:90});
        const loaded = await new Promise(resolve => {
          const img = new Image(); let done = false;
          const finish = ok => { if(done) return; done=true; clearTimeout(timer); img.onload=img.onerror=null; scene.cancelImage=null; if(!ok) img.removeAttribute('src'); resolve(ok); };
          const timer = setTimeout(()=>finish(false),5000);
          scene.cancelImage = () => finish(false);
          img.onload=()=>finish(img.naturalWidth>0); img.onerror=()=>finish(false); img.src=url;
        });
        if (!current()) return;
        if (loaded) {
          scene.art='url('+JSON.stringify(url)+')';
          syncCollection(); return;
        }
      }
    } catch { /* Collections - On failure, retain a neutral background and native navigation. */ }
    finally { scene.loading=false; scene.retry=Date.now()+60000; }
  }
  // Navigation - Mount home for the current route and invalidate data on session changes.
  async function mount() {
    if (stopped) return;
    if (!enabled()) { pending = null; removeHero(); clearCollection(); return; }
    consumePlay();
    const api = currentClient(), key = sessionKey(api);
    if (key !== identity) {
      generation++; action++; pending = null; items = []; retryAt = 0;
      loading = false; removeHero(); identity = key;
    }
    client = api;
    if (!home() || !key) { removeHero(); if(key) syncCollection(); else clearCollection(); return; }
    clearCollection();
    const page = [...document.querySelectorAll('.homePage')].find(visible);
    const sections = page && [...page.querySelectorAll('.homeSectionsContainer')].find(n => !n.closest('.hide,[hidden]') && getComputedStyle(n).display !== 'none');
    if (!sections) return;
    if (hero?.isConnected && hero.parentNode === sections.parentNode) return;
    removeHero();
    if (!items.length) {
      if (loading || Date.now() < retryAt) return;
      loading = true;
      const run = ++generation;
      try {
        const result = await api.getItems(api.getCurrentUserId(), {
          IncludeItemTypes: 'Movie,Series', Recursive: true, SortBy: 'Random', Limit: 30,
          Fields: 'Overview,Genres,CommunityRating,OfficialRating,ProductionYear,BackdropImageTags,ParentBackdropImageTags,ParentBackdropItemId',
          EnableImages: true, ImageTypes: 'Backdrop,Primary'
        });
        if (stopped || run !== generation || key !== sessionKey(currentClient())) return;
        lastError = '';
        items = (result?.Items || []).filter(x => x.Id && x.Name && backdrop(x)).slice(0, MAX);
      } catch { lastError = 'Library loading failed; retrying in 30 seconds.'; }
      finally { if (run === generation) { loading = false; retryAt = Date.now() + 30000; } }
    }
    if (stopped || !home() || !enabled() || key !== sessionKey(currentClient()) || !sections.isConnected || !visible(page) || !items.length) return;
    sections.before(build()); render(0);
  }
  const detailMetadata = new Map();
  const detailFallbacks = new Map();
  // Playback - Synchronize labels through attributes without modifying native options.
  function syncTrackLabels() {
    document.querySelectorAll('.trackSelections select').forEach(select => {
      const label = select.selectedOptions[0]?.textContent || '';
      if (select.getAttribute('data-aa-selected-label') !== label) select.setAttribute('data-aa-selected-label', label);
      const row = select.closest('.selectVideoContainer');
      if (row) {
        if (select.disabled && row.getAttribute('data-aa-video-summary') !== label) row.setAttribute('data-aa-video-summary', label);
        else if (!select.disabled) row.removeAttribute('data-aa-video-summary');
      }
    });
  }
  listen(document, 'change', syncTrackLabels, true);
  // Details - Synchronize fallback artwork and group secondary metadata.
  function syncDetailMetadata() {
    if (enabled()) syncTrackLabels();
    const selector = '.itemDetailPage:not(.aa-collection-page):not(:has(.collectionItems:not(.hide):not([hidden]))):has(.detailImageContainer :is(.portraitCard,.backdropCard,.squareCard))';
    for (const [backdrop] of detailFallbacks) {
      if (!backdrop.isConnected || !enabled() || !backdrop.closest(selector)) {
        backdrop.style.removeProperty('--aa-detail-fallback'); backdrop.classList.remove('aa-detail-no-backdrop'); detailFallbacks.delete(backdrop);
      }
    }
    if (enabled()) document.querySelectorAll(selector).forEach(page => {
      const backdrop = page.querySelector('.itemBackdrop');
      const art = page.querySelector('.detailImageContainer .cardImageContainer');
      if (!backdrop || !art) return;
      const missing = !backdrop.style.backgroundImage || backdrop.style.backgroundImage === 'none';
      if (backdrop.classList.contains('aa-detail-no-backdrop') !== missing) backdrop.classList.toggle('aa-detail-no-backdrop', missing);
      const background = getComputedStyle(art).backgroundImage;
      if (background && background !== 'none' && backdrop.style.getPropertyValue('--aa-detail-fallback') !== background) {
        backdrop.style.setProperty('--aa-detail-fallback', background); detailFallbacks.set(backdrop, true);
      }
      if (route() === '#/details' && visible(page)) {
        rememberBackground(missing ? background : getComputedStyle(backdrop).backgroundImage,
          sessionKey(currentClient()), page);
      }
    });
    // Compatibility - Preserve native selectors and options.
    // ChildList mutations, including selectedcontent, trigger Remux resets.
    // Base-select styling and attributes avoid modifying child nodes.
    for (const [tags, wrapper] of detailMetadata) {
      if (!tags.isConnected || !enabled() || !tags.closest(selector)) {
        if (wrapper.isConnected && tags.parentNode === wrapper) wrapper.before(tags);
        wrapper.remove(); detailMetadata.delete(tags);
      }
    }
    if (!enabled()) return;
    document.querySelectorAll(selector + ' .itemTags').forEach(tags => {
      if (detailMetadata.has(tags)) return;
      const wrapper = element('details', 'aa-detail-metadata');
      wrapper.append(element('summary', '', translate('ItemDetails')));
      tags.before(wrapper); wrapper.append(tags); detailMetadata.set(tags, wrapper);
    });
  }
  // Localization - Update existing labels without rebuilding controls or resetting the slide.
  function syncLanguage() {
    const text = (node, value) => { if (node && node.textContent !== value) node.textContent = value; };
    const attribute = (node, name, value) => { if (node && node.getAttribute(name) !== value) node.setAttribute(name, value); };
    if (hero) {
      attribute(hero, 'aria-label', translate('MoviesAndShows'));
      text(hero.querySelector('.aa-hero-btn-play'), translate('Play'));
      text(hero.querySelector('.aa-hero-kicker'), translate(items[index]?.Type === 'Series' ? 'Series' : 'Movie'));
      const info = hero.querySelector('.aa-hero-btn-info');
      attribute(info, 'aria-label', translate('ItemDetails'));
      attribute(info, 'title', translate('ItemDetails'));
      const status = hero.querySelector('.aa-hero-status');
      if (status?.dataset.translation) text(status, translate(status.dataset.translation));
    }
    document.querySelectorAll('.aa-detail-metadata > summary').forEach(node => text(node, translate('ItemDetails')));
    document.querySelectorAll('#itemDetailPage .btnPlay .detailButton-content').forEach(node => {
      const page = node.closest('#itemDetailPage');
      const resume = page.querySelector('.btnReplay:not(.hide)');
      attribute(node, 'data-aa-play-label', translate(resume ? 'Resume' : 'Play'));
    });
  }
  // Synchronization - Handle route and content changes without unnecessary home remounts.
  const schedule = () => {
    if (stopped) return;
    syncDetailMetadata();
    syncLanguage();
    // Navigation - Apply collection layout before the next paint.
    // Only the heavier home mounting work is debounced.
    if (enabled() && sessionKey(currentClient())) syncCollection();
    else clearCollection();
    syncSearchArt();
    if (scheduled) return;
    scheduled = setTimeout(() => { scheduled = 0; void mount(); }, 150);
  };
  // Observation - Ignore carousel mutations to prevent mounting loops.
  const observer = new MutationObserver(records => {
    if (records.some(r => !(r.target instanceof Element) || !r.target.closest('#lumaaGlaassHero'))) schedule();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-id', 'disabled', 'lang', 'data-culture'] });
  listen(window, 'hashchange', schedule); listen(window, 'popstate', schedule);
  listen(document, 'viewshow', e => {
    if (e.target instanceof Element && e.target.matches('.itemDetailPage') && e.detail?.params?.id) viewIds.set(e.target, e.detail.params.id);
    schedule();
  }, true);
  listen(document, 'load', schedule, true);
  listen(motion, 'change', () => { removeHero(); schedule(); });
  // Glass - Displace only the background, never text or icons.
  // Restrict SVG filters to compatible desktop Chromium browsers.
  function setupGlass() {
    if (getComputedStyle(document.documentElement).getPropertyValue('--aa-glass-refraction').trim() !== '1') return () => {};
    const supported = /(?:Chrome|Chromium|Edg)\//.test(navigator.userAgent) && !/Android|Mobile/.test(navigator.userAgent)
      && CSS.supports('backdrop-filter', 'url("#aa-lens-test")');
    if (!supported) return () => {};
    const selector = '.skinHeader:not(.osdHeader) .headerButton:not(.headerUserButtonRound), .skinHeader:not(.osdHeader) .emby-tabs-slider, .aa-hero .aa-hero-btn-info';
    const reduced = matchMedia('(prefers-reduced-transparency: reduce)'), contrast = matchMedia('(prefers-contrast: more)'), forced = matchMedia('(forced-colors: active)');
    const ns = 'http://www.w3.org/2000/svg', entries = new Map();
    const svgNode = (tag, attrs) => { const n = document.createElementNS(ns, tag); Object.entries(attrs || {}).forEach(([k,v]) => n.setAttribute(k, v)); return n; };
    const svg = svgNode('svg', {width:0,height:0,'aria-hidden':'true',focusable:'false','data-aa-lenses':'true'});
    svg.style.cssText = 'position:absolute;pointer-events:none;overflow:hidden;';
    const defs = svgNode('defs'); svg.append(defs); document.body.append(svg);
    let serial = 0;
    function update(node) {
      const entry = entries.get(node); if (!entry) return;
      const rect = node.getBoundingClientRect(), w = Math.round(rect.width), h = Math.round(rect.height);
      if (!w || !h || w > 700 || h > 100) { node.style.removeProperty('--aa-lens-filter'); return; }
      const key = w + 'x' + h;
      if (entry.size !== key) {
        const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d'); if (!ctx) return;
        const pixels=ctx.createImageData(w,h), r=Math.min(w,h)/2, rim=Math.min(8,r*.4);
        for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
          // Glass - Signed capsule distance: neutral center and exterior, curved rim.
          const px=x+.5, py=y+.5, cx=Math.max(r,Math.min(w-r,px));
          const dx=px-cx, dy=py-h/2, length=Math.hypot(dx,dy), depth=r-length;
          const bend=depth>0 && depth<rim ? Math.sin(Math.PI*depth/rim)*.38 : 0;
          const offset=(y*w+x)*4;
          pixels.data[offset]=Math.round(128+255*bend*dx/(length||1));
          pixels.data[offset+1]=Math.round(128+255*bend*dy/(length||1));
          pixels.data[offset+2]=128; pixels.data[offset+3]=255;
        }
        ctx.putImageData(pixels,0,0);
        entry.filter.replaceChildren();
        entry.filter.append(svgNode('feImage',{href:canvas.toDataURL(),'x':0,'y':0,width:'100%',height:'100%',preserveAspectRatio:'none',result:'map'}),
          svgNode('feDisplacementMap',{in:'SourceGraphic',in2:'map',scale:10,xChannelSelector:'R',yChannelSelector:'G',result:'lens'}),
          svgNode('feGaussianBlur',{in:'lens',stdDeviation:.35}));
        entry.size=key;
      }
      node.style.setProperty('--aa-lens-filter', 'url("#'+entry.filter.id+'")');
    }
    const resize = new ResizeObserver(records => records.forEach(r => update(r.target)));
    function remove(node,entry) { resize.unobserve(node); node.style.removeProperty('--aa-lens-filter'); entry.filter.remove(); entries.delete(node); }
    function sync() {
      const disabled = reduced.matches || contrast.matches || forced.matches || !enabled();
      for (const [node,entry] of entries) if(disabled || !node.isConnected || !node.matches(selector)) remove(node,entry);
      if(disabled) return;
      [...document.querySelectorAll(selector)].slice(0,16).forEach(node => {
        if(!entries.has(node)) {
          const filter=svgNode('filter',{id:'aa-liquid-lens-'+(++serial),x:0,y:0,width:'100%',height:'100%','color-interpolation-filters':'sRGB'});
          defs.append(filter); entries.set(node,{filter,size:''}); resize.observe(node);
        }
        update(node);
      });
    }
    sync(); const timer=setInterval(sync,1200);
    reduced.addEventListener('change',sync); contrast.addEventListener('change',sync); forced.addEventListener('change',sync);
    return () => { clearInterval(timer); resize.disconnect(); reduced.removeEventListener('change',sync); contrast.removeEventListener('change',sync); forced.removeEventListener('change',sync); for(const [node,entry] of entries) remove(node,entry); svg.remove(); };
  }
  const stopGlass = setupGlass();
  const poll = setInterval(schedule, 1000);
  // Carousel - Only the selected indicator changes shape.
  function tick(now) {
    if (stopped) return;
    const running = !!(hero?.isConnected && items.length > 1 && home() && !document.hidden && !motion.matches && !hovered && !touching && !hero.contains(document.activeElement) && !hero.querySelector('[aria-busy="true"]'));
    if (running && wasRunning && lastTick) {
      const delta = now - lastTick;
      // Carousel - Ignore elapsed time while the tab or device was suspended.
      if (delta < 250) elapsed += delta;
      if (elapsed >= INTERVAL) render(index + 1);
    }
    wasRunning = running; lastTick = now;
    frame = requestAnimationFrame(tick);
  }
  listen(document, 'visibilitychange', () => { lastTick = 0; wasRunning = false; });
  frame = requestAnimationFrame(tick);
  // Lifecycle - Expose status and remove theme effects when stopped.
  window[KEY] = { get status() { return { active: !!hero?.isConnected, items: items.length, loading, error: lastError }; }, stop() {
    stopped = true; generation++; action++; pending = null;
    if (backgroundRequest) backgroundRequest.image.onload = backgroundRequest.image.onerror = null;
    backgroundRequest = null;
    observer.disconnect(); listeners.forEach(fn => fn());
    for (const [tags, wrapper] of detailMetadata) { if (wrapper.isConnected && tags.parentNode === wrapper) wrapper.before(tags); wrapper.remove(); }
    detailMetadata.clear();
    document.querySelectorAll('[data-aa-selected-label]').forEach(select => select.removeAttribute('data-aa-selected-label'));
    document.querySelectorAll('[data-aa-video-summary]').forEach(row => row.removeAttribute('data-aa-video-summary'));
    for (const backdrop of detailFallbacks.keys()) { backdrop.style.removeProperty('--aa-detail-fallback'); backdrop.classList.remove('aa-detail-no-backdrop'); }
    detailFallbacks.clear();
    clearTimeout(scheduled); clearInterval(poll); cancelAnimationFrame(frame); stopGlass(); removeHero(); clearCollection();
    lastBackgroundArt = ''; lastBackgroundKey = ''; syncSearchArt();
    delete window[KEY];
  } };
  schedule();
})();
/* LUMAAGLAASS:END */
