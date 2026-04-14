// Each word has: word, emoji, imageQuery (for Unsplash), and translations.
// Words are ordered roughly easiest → harder within each category.
// This list is the fallback word bank when a video has no captions.

export const vocabulary = [

  // ── Animals ──────────────────────────────────────────────────────────────
  { word: 'cat',       emoji: '🐱', imageQuery: 'cute,cat,kitten',          translations: { he: 'חתול',     es: 'gato',       fr: 'chat',        de: 'Katze',      ar: 'قطة',      ru: 'кошка',      zh: '猫',     pt: 'gato'       } },
  { word: 'dog',       emoji: '🐶', imageQuery: 'cute,dog,puppy',           translations: { he: 'כלב',      es: 'perro',      fr: 'chien',       de: 'Hund',       ar: 'كلب',      ru: 'собака',     zh: '狗',     pt: 'cachorro'   } },
  { word: 'fish',      emoji: '🐟', imageQuery: 'colorful,fish,aquarium',   translations: { he: 'דג',       es: 'pez',        fr: 'poisson',     de: 'Fisch',      ar: 'سمكة',     ru: 'рыба',       zh: '鱼',     pt: 'peixe'      } },
  { word: 'bird',      emoji: '🐦', imageQuery: 'colorful,bird,parrot',     translations: { he: 'ציפור',    es: 'pájaro',     fr: 'oiseau',      de: 'Vogel',      ar: 'طائر',     ru: 'птица',      zh: '鸟',     pt: 'pássaro'    } },
  { word: 'duck',      emoji: '🦆', imageQuery: 'yellow,duck,pond',         translations: { he: 'ברווז',    es: 'pato',       fr: 'canard',      de: 'Ente',       ar: 'بطة',      ru: 'утка',       zh: '鸭子',   pt: 'pato'       } },
  { word: 'frog',      emoji: '🐸', imageQuery: 'green,frog,pond',          translations: { he: 'צפרדע',    es: 'rana',       fr: 'grenouille',  de: 'Frosch',     ar: 'ضفدع',     ru: 'лягушка',    zh: '青蛙',   pt: 'sapo'       } },
  { word: 'horse',     emoji: '🐴', imageQuery: 'brown,horse,field',        translations: { he: 'סוס',      es: 'caballo',    fr: 'cheval',      de: 'Pferd',      ar: 'حصان',     ru: 'лошадь',     zh: '马',     pt: 'cavalo'     } },
  { word: 'cow',       emoji: '🐄', imageQuery: 'cow,farm,field',           translations: { he: 'פרה',      es: 'vaca',       fr: 'vache',       de: 'Kuh',        ar: 'بقرة',     ru: 'корова',     zh: '牛',     pt: 'vaca'       } },
  { word: 'pig',       emoji: '🐷', imageQuery: 'pink,pig,cute',            translations: { he: 'חזיר',     es: 'cerdo',      fr: 'cochon',      de: 'Schwein',    ar: 'خنزير',    ru: 'свинья',     zh: '猪',     pt: 'porco'      } },
  { word: 'sheep',     emoji: '🐑', imageQuery: 'white,sheep,field',        translations: { he: 'כבש',      es: 'oveja',      fr: 'mouton',      de: 'Schaf',      ar: 'خروف',     ru: 'овца',       zh: '羊',     pt: 'ovelha'     } },
  { word: 'bear',      emoji: '🐻', imageQuery: 'brown,bear,forest',        translations: { he: 'דוב',      es: 'oso',        fr: 'ours',        de: 'Bär',        ar: 'دب',       ru: 'медведь',    zh: '熊',     pt: 'urso'       } },
  { word: 'lion',      emoji: '🦁', imageQuery: 'lion,mane,wild',           translations: { he: 'אריה',     es: 'león',       fr: 'lion',        de: 'Löwe',       ar: 'أسد',      ru: 'лев',        zh: '狮子',   pt: 'leão'       } },
  { word: 'monkey',    emoji: '🐒', imageQuery: 'monkey,jungle,cute',       translations: { he: 'קוף',      es: 'mono',       fr: 'singe',       de: 'Affe',       ar: 'قرد',      ru: 'обезьяна',   zh: '猴子',   pt: 'macaco'     } },
  { word: 'elephant',  emoji: '🐘', imageQuery: 'elephant,big,wild',        translations: { he: 'פיל',      es: 'elefante',   fr: 'éléphant',    de: 'Elefant',    ar: 'فيل',      ru: 'слон',       zh: '大象',   pt: 'elefante'   } },
  { word: 'rabbit',    emoji: '🐰', imageQuery: 'cute,white,rabbit',        translations: { he: 'ארנב',     es: 'conejo',     fr: 'lapin',       de: 'Hase',       ar: 'أرنب',     ru: 'кролик',     zh: '兔子',   pt: 'coelho'     } },
  { word: 'butterfly', emoji: '🦋', imageQuery: 'colorful,butterfly,flower',translations: { he: 'פרפר',     es: 'mariposa',   fr: 'papillon',    de: 'Schmetterling', ar: 'فراشة', ru: 'бабочка',  zh: '蝴蝶',   pt: 'borboleta'  } },
  { word: 'turtle',    emoji: '🐢', imageQuery: 'green,turtle,cute',        translations: { he: 'צב',       es: 'tortuga',    fr: 'tortue',      de: 'Schildkröte',ar: 'سلحفاة',   ru: 'черепаха',   zh: '乌龟',   pt: 'tartaruga'  } },

  // ── Food & Drink ──────────────────────────────────────────────────────────
  { word: 'apple',     emoji: '🍎', imageQuery: 'apple,fruit,red',          translations: { he: 'תפוח',     es: 'manzana',    fr: 'pomme',       de: 'Apfel',      ar: 'تفاحة',    ru: 'яблоко',     zh: '苹果',   pt: 'maçã'       } },
  { word: 'banana',    emoji: '🍌', imageQuery: 'banana,yellow,fruit',      translations: { he: 'בננה',     es: 'plátano',    fr: 'banane',      de: 'Banane',     ar: 'موزة',     ru: 'банан',      zh: '香蕉',   pt: 'banana'     } },
  { word: 'orange',    emoji: '🍊', imageQuery: 'orange,citrus,fruit',      translations: { he: 'תפוז',     es: 'naranja',    fr: 'orange',      de: 'Orange',     ar: 'برتقال',   ru: 'апельсин',   zh: '橙子',   pt: 'laranja'    } },
  { word: 'strawberry',emoji: '🍓', imageQuery: 'strawberry,red,fruit',     translations: { he: 'תות',      es: 'fresa',      fr: 'fraise',      de: 'Erdbeere',   ar: 'فراولة',   ru: 'клубника',   zh: '草莓',   pt: 'morango'    } },
  { word: 'bread',     emoji: '🍞', imageQuery: 'fresh,bread,loaf',         translations: { he: 'לחם',      es: 'pan',        fr: 'pain',        de: 'Brot',       ar: 'خبز',      ru: 'хлеб',       zh: '面包',   pt: 'pão'        } },
  { word: 'milk',      emoji: '🥛', imageQuery: 'glass,milk,white',         translations: { he: 'חלב',      es: 'leche',      fr: 'lait',        de: 'Milch',      ar: 'حليب',     ru: 'молоко',     zh: '牛奶',   pt: 'leite'      } },
  { word: 'egg',       emoji: '🥚', imageQuery: 'egg,white,breakfast',      translations: { he: 'ביצה',     es: 'huevo',      fr: 'oeuf',        de: 'Ei',         ar: 'بيضة',     ru: 'яйцо',       zh: '鸡蛋',   pt: 'ovo'        } },
  { word: 'cake',      emoji: '🎂', imageQuery: 'birthday,cake,colorful',   translations: { he: 'עוגה',     es: 'pastel',     fr: 'gâteau',      de: 'Kuchen',     ar: 'كعكة',     ru: 'торт',       zh: '蛋糕',   pt: 'bolo'       } },
  { word: 'pizza',     emoji: '🍕', imageQuery: 'pizza,cheese,delicious',   translations: { he: 'פיצה',     es: 'pizza',      fr: 'pizza',       de: 'Pizza',      ar: 'بيتزا',    ru: 'пицца',      zh: '披萨',   pt: 'pizza'      } },
  { word: 'cheese',    emoji: '🧀', imageQuery: 'yellow,cheese,food',       translations: { he: 'גבינה',    es: 'queso',      fr: 'fromage',     de: 'Käse',       ar: 'جبن',      ru: 'сыр',        zh: '奶酪',   pt: 'queijo'     } },
  { word: 'carrot',    emoji: '🥕', imageQuery: 'orange,carrot,vegetable',  translations: { he: 'גזר',      es: 'zanahoria',  fr: 'carotte',     de: 'Möhre',      ar: 'جزرة',     ru: 'морковь',    zh: '胡萝卜', pt: 'cenoura'    } },
  { word: 'soup',      emoji: '🍲', imageQuery: 'warm,soup,bowl',           translations: { he: 'מרק',      es: 'sopa',       fr: 'soupe',       de: 'Suppe',      ar: 'شوربة',    ru: 'суп',        zh: '汤',     pt: 'sopa'       } },
  { word: 'juice',     emoji: '🧃', imageQuery: 'colorful,juice,glass',     translations: { he: 'מיץ',      es: 'jugo',       fr: 'jus',         de: 'Saft',       ar: 'عصير',     ru: 'сок',        zh: '果汁',   pt: 'suco'       } },
  { word: 'water',     emoji: '💧', imageQuery: 'blue,water,splash',        translations: { he: 'מים',      es: 'agua',       fr: 'eau',         de: 'Wasser',     ar: 'ماء',      ru: 'вода',       zh: '水',     pt: 'água'       } },

  // ── Colors ────────────────────────────────────────────────────────────────
  { word: 'red',       emoji: '🔴', imageQuery: 'red,color,bright',         translations: { he: 'אדום',     es: 'rojo',       fr: 'rouge',       de: 'rot',        ar: 'أحمر',     ru: 'красный',    zh: '红色',   pt: 'vermelho'   } },
  { word: 'blue',      emoji: '🔵', imageQuery: 'blue,color,sky',           translations: { he: 'כחול',     es: 'azul',       fr: 'bleu',        de: 'blau',       ar: 'أزرق',     ru: 'синий',      zh: '蓝色',   pt: 'azul'       } },
  { word: 'green',     emoji: '💚', imageQuery: 'green,color,nature',       translations: { he: 'ירוק',     es: 'verde',      fr: 'vert',        de: 'grün',       ar: 'أخضر',     ru: 'зелёный',    zh: '绿色',   pt: 'verde'      } },
  { word: 'yellow',    emoji: '💛', imageQuery: 'yellow,color,bright',      translations: { he: 'צהוב',     es: 'amarillo',   fr: 'jaune',       de: 'gelb',       ar: 'أصفر',     ru: 'жёлтый',     zh: '黄色',   pt: 'amarelo'    } },
  { word: 'pink',      emoji: '🩷', imageQuery: 'pink,color,flower',        translations: { he: 'ורוד',     es: 'rosa',       fr: 'rose',        de: 'rosa',       ar: 'وردي',     ru: 'розовый',    zh: '粉红',   pt: 'rosa'       } },
  { word: 'purple',    emoji: '💜', imageQuery: 'purple,color,violet',      translations: { he: 'סגול',     es: 'morado',     fr: 'violet',      de: 'lila',       ar: 'بنفسجي',   ru: 'фиолетовый', zh: '紫色',   pt: 'roxo'       } },
  { word: 'white',     emoji: '⬜', imageQuery: 'white,color,snow',         translations: { he: 'לבן',      es: 'blanco',     fr: 'blanc',       de: 'weiß',       ar: 'أبيض',     ru: 'белый',      zh: '白色',   pt: 'branco'     } },
  { word: 'black',     emoji: '⬛', imageQuery: 'black,dark,night',         translations: { he: 'שחור',     es: 'negro',      fr: 'noir',        de: 'schwarz',    ar: 'أسود',     ru: 'чёрный',     zh: '黑色',   pt: 'preto'      } },

  // ── Body parts ────────────────────────────────────────────────────────────
  { word: 'eye',       emoji: '👁️', imageQuery: 'eye,close,colorful',       translations: { he: 'עין',      es: 'ojo',        fr: 'oeil',        de: 'Auge',       ar: 'عين',      ru: 'глаз',       zh: '眼睛',   pt: 'olho'       } },
  { word: 'nose',      emoji: '👃', imageQuery: 'face,nose,smile',          translations: { he: 'אף',       es: 'nariz',      fr: 'nez',         de: 'Nase',       ar: 'أنف',      ru: 'нос',        zh: '鼻子',   pt: 'nariz'      } },
  { word: 'mouth',     emoji: '👄', imageQuery: 'smile,mouth,teeth',        translations: { he: 'פה',       es: 'boca',       fr: 'bouche',      de: 'Mund',       ar: 'فم',       ru: 'рот',        zh: '嘴',     pt: 'boca'       } },
  { word: 'ear',       emoji: '👂', imageQuery: 'ear,face,close',           translations: { he: 'אוזן',     es: 'oreja',      fr: 'oreille',     de: 'Ohr',        ar: 'أذن',      ru: 'ухо',        zh: '耳朵',   pt: 'orelha'     } },
  { word: 'hand',      emoji: '✋', imageQuery: 'hand,palm,fingers',        translations: { he: 'יד',       es: 'mano',       fr: 'main',        de: 'Hand',       ar: 'يد',       ru: 'рука',       zh: '手',     pt: 'mão'        } },
  { word: 'head',      emoji: '🗣️', imageQuery: 'head,face,portrait',       translations: { he: 'ראש',      es: 'cabeza',     fr: 'tête',        de: 'Kopf',       ar: 'رأس',      ru: 'голова',     zh: '头',     pt: 'cabeça'     } },
  { word: 'hair',      emoji: '💇', imageQuery: 'colorful,hair,style',      translations: { he: 'שיער',     es: 'pelo',       fr: 'cheveux',     de: 'Haar',       ar: 'شعر',      ru: 'волосы',     zh: '头发',   pt: 'cabelo'     } },
  { word: 'leg',       emoji: '🦵', imageQuery: 'leg,running,active',       translations: { he: 'רגל',      es: 'pierna',     fr: 'jambe',       de: 'Bein',       ar: 'ساق',      ru: 'нога',       zh: '腿',     pt: 'perna'      } },

  // ── Actions ───────────────────────────────────────────────────────────────
  { word: 'run',       emoji: '🏃', imageQuery: 'child,running,park',       translations: { he: 'לרוץ',     es: 'correr',     fr: 'courir',      de: 'laufen',     ar: 'يجري',     ru: 'бежать',     zh: '跑',     pt: 'correr'     } },
  { word: 'jump',      emoji: '🤸', imageQuery: 'child,jumping,fun',        translations: { he: 'לקפוץ',    es: 'saltar',     fr: 'sauter',      de: 'springen',   ar: 'يقفز',     ru: 'прыгать',    zh: '跳',     pt: 'pular'      } },
  { word: 'swim',      emoji: '🏊', imageQuery: 'child,swimming,pool',      translations: { he: 'לשחות',    es: 'nadar',      fr: 'nager',       de: 'schwimmen',  ar: 'يسبح',     ru: 'плавать',    zh: '游泳',   pt: 'nadar'      } },
  { word: 'sing',      emoji: '🎤', imageQuery: 'child,singing,music',      translations: { he: 'לשיר',     es: 'cantar',     fr: 'chanter',     de: 'singen',     ar: 'يغني',     ru: 'петь',       zh: '唱歌',   pt: 'cantar'     } },
  { word: 'dance',     emoji: '💃', imageQuery: 'child,dancing,happy',      translations: { he: 'לרקוד',    es: 'bailar',     fr: 'danser',      de: 'tanzen',     ar: 'يرقص',     ru: 'танцевать',  zh: '跳舞',   pt: 'dançar'     } },
  { word: 'sleep',     emoji: '😴', imageQuery: 'child,sleeping,cozy',      translations: { he: 'לישון',    es: 'dormir',     fr: 'dormir',      de: 'schlafen',   ar: 'ينام',     ru: 'спать',      zh: '睡觉',   pt: 'dormir'     } },
  { word: 'draw',      emoji: '🖍️', imageQuery: 'child,drawing,art',        translations: { he: 'לצייר',    es: 'dibujar',    fr: 'dessiner',    de: 'zeichnen',   ar: 'يرسم',     ru: 'рисовать',   zh: '画画',   pt: 'desenhar'   } },

  // ── Nature & World ────────────────────────────────────────────────────────
  { word: 'sun',       emoji: '☀️', imageQuery: 'bright,sun,sky',           translations: { he: 'שמש',      es: 'sol',        fr: 'soleil',      de: 'Sonne',      ar: 'شمس',      ru: 'солнце',     zh: '太阳',   pt: 'sol'        } },
  { word: 'moon',      emoji: '🌙', imageQuery: 'full,moon,night,sky',      translations: { he: 'ירח',      es: 'luna',       fr: 'lune',        de: 'Mond',       ar: 'قمر',      ru: 'луна',       zh: '月亮',   pt: 'lua'        } },
  { word: 'star',      emoji: '⭐', imageQuery: 'star,sparkle,night',       translations: { he: 'כוכב',     es: 'estrella',   fr: 'étoile',      de: 'Stern',      ar: 'نجمة',     ru: 'звезда',     zh: '星星',   pt: 'estrela'    } },
  { word: 'cloud',     emoji: '☁️', imageQuery: 'fluffy,cloud,sky,blue',    translations: { he: 'ענן',      es: 'nube',       fr: 'nuage',       de: 'Wolke',      ar: 'سحابة',    ru: 'облако',     zh: '云',     pt: 'nuvem'      } },
  { word: 'rain',      emoji: '🌧️', imageQuery: 'rain,drops,weather',       translations: { he: 'גשם',      es: 'lluvia',     fr: 'pluie',       de: 'Regen',      ar: 'مطر',      ru: 'дождь',      zh: '雨',     pt: 'chuva'      } },
  { word: 'snow',      emoji: '❄️', imageQuery: 'white,snow,winter',        translations: { he: 'שלג',      es: 'nieve',      fr: 'neige',       de: 'Schnee',     ar: 'ثلج',      ru: 'снег',       zh: '雪',     pt: 'neve'       } },
  { word: 'fire',      emoji: '🔥', imageQuery: 'fire,flame,orange',        translations: { he: 'אש',       es: 'fuego',      fr: 'feu',         de: 'Feuer',      ar: 'نار',      ru: 'огонь',      zh: '火',     pt: 'fogo'       } },
  { word: 'flower',    emoji: '🌸', imageQuery: 'colorful,flower,bloom',    translations: { he: 'פרח',      es: 'flor',       fr: 'fleur',       de: 'Blume',      ar: 'زهرة',     ru: 'цветок',     zh: '花',     pt: 'flor'       } },
  { word: 'tree',      emoji: '🌳', imageQuery: 'big,tree,green',           translations: { he: 'עץ',       es: 'árbol',      fr: 'arbre',       de: 'Baum',       ar: 'شجرة',     ru: 'дерево',     zh: '树',     pt: 'árvore'     } },
  { word: 'sea',       emoji: '🌊', imageQuery: 'blue,sea,ocean,waves',     translations: { he: 'ים',       es: 'mar',        fr: 'mer',         de: 'Meer',       ar: 'بحر',      ru: 'море',       zh: '海',     pt: 'mar'        } },
  { word: 'rainbow',   emoji: '🌈', imageQuery: 'rainbow,colorful,sky',     translations: { he: 'קשת',      es: 'arcoíris',   fr: 'arc-en-ciel', de: 'Regenbogen', ar: 'قوس قزح',  ru: 'радуга',     zh: '彩虹',   pt: 'arco-íris'  } },
  { word: 'mountain',  emoji: '⛰️', imageQuery: 'mountain,peak,landscape',  translations: { he: 'הר',       es: 'montaña',    fr: 'montagne',    de: 'Berg',       ar: 'جبل',      ru: 'гора',       zh: '山',     pt: 'montanha'   } },

  // ── Home & Objects ────────────────────────────────────────────────────────
  { word: 'house',     emoji: '🏠', imageQuery: 'colorful,house,home',      translations: { he: 'בית',      es: 'casa',       fr: 'maison',      de: 'Haus',       ar: 'بيت',      ru: 'дом',        zh: '房子',   pt: 'casa'       } },
  { word: 'door',      emoji: '🚪', imageQuery: 'colorful,door,entrance',   translations: { he: 'דלת',      es: 'puerta',     fr: 'porte',       de: 'Tür',        ar: 'باب',      ru: 'дверь',      zh: '门',     pt: 'porta'      } },
  { word: 'table',     emoji: '🪑', imageQuery: 'wooden,table,furniture',   translations: { he: 'שולחן',    es: 'mesa',       fr: 'table',       de: 'Tisch',      ar: 'طاولة',    ru: 'стол',       zh: '桌子',   pt: 'mesa'       } },
  { word: 'chair',     emoji: '🪑', imageQuery: 'colorful,chair,seat',      translations: { he: 'כיסא',     es: 'silla',      fr: 'chaise',      de: 'Stuhl',      ar: 'كرسي',     ru: 'стул',       zh: '椅子',   pt: 'cadeira'    } },
  { word: 'book',      emoji: '📚', imageQuery: 'colorful,children,book',   translations: { he: 'ספר',      es: 'libro',      fr: 'livre',       de: 'Buch',       ar: 'كتاب',     ru: 'книга',      zh: '书',     pt: 'livro'      } },
  { word: 'clock',     emoji: '🕐', imageQuery: 'colorful,clock,time',      translations: { he: 'שעון',     es: 'reloj',      fr: 'horloge',     de: 'Uhr',        ar: 'ساعة',     ru: 'часы',       zh: '时钟',   pt: 'relógio'    } },
  { word: 'pencil',    emoji: '✏️', imageQuery: 'pencil,yellow,draw',       translations: { he: 'עיפרון',   es: 'lápiz',      fr: 'crayon',      de: 'Bleistift',  ar: 'قلم رصاص', ru: 'карандаш',   zh: '铅笔',   pt: 'lápis'      } },
  { word: 'ball',      emoji: '⚽', imageQuery: 'colorful,ball,sport',      translations: { he: 'כדור',     es: 'pelota',     fr: 'balle',       de: 'Ball',       ar: 'كرة',      ru: 'мяч',        zh: '球',     pt: 'bola'       } },

  // ── Transport ─────────────────────────────────────────────────────────────
  { word: 'car',       emoji: '🚗', imageQuery: 'red,car,toy',              translations: { he: 'מכונית',   es: 'coche',      fr: 'voiture',     de: 'Auto',       ar: 'سيارة',    ru: 'машина',     zh: '汽车',   pt: 'carro'      } },
  { word: 'boat',      emoji: '⛵', imageQuery: 'sailboat,ocean,blue',      translations: { he: 'סירה',     es: 'barco',      fr: 'bateau',      de: 'Boot',       ar: 'قارب',     ru: 'лодка',      zh: '船',     pt: 'barco'      } },
  { word: 'train',     emoji: '🚂', imageQuery: 'colorful,train,railway',   translations: { he: 'רכבת',     es: 'tren',       fr: 'train',       de: 'Zug',        ar: 'قطار',     ru: 'поезд',      zh: '火车',   pt: 'trem'       } },
  { word: 'plane',     emoji: '✈️', imageQuery: 'airplane,sky,flying',      translations: { he: 'מטוס',     es: 'avión',      fr: 'avion',       de: 'Flugzeug',   ar: 'طائرة',    ru: 'самолёт',    zh: '飞机',   pt: 'avião'      } },

  // ── Clothing ──────────────────────────────────────────────────────────────
  { word: 'hat',       emoji: '🎩', imageQuery: 'funny,hat,colorful',       translations: { he: 'כובע',     es: 'sombrero',   fr: 'chapeau',     de: 'Hut',        ar: 'قبعة',     ru: 'шляпа',      zh: '帽子',   pt: 'chapéu'     } },
  { word: 'shoe',      emoji: '👟', imageQuery: 'colorful,sneaker,shoe',    translations: { he: 'נעל',      es: 'zapato',     fr: 'chaussure',   de: 'Schuh',      ar: 'حذاء',     ru: 'ботинок',    zh: '鞋',     pt: 'sapato'     } },
  { word: 'dress',     emoji: '👗', imageQuery: 'colorful,dress,fashion',   translations: { he: 'שמלה',     es: 'vestido',    fr: 'robe',        de: 'Kleid',      ar: 'فستان',    ru: 'платье',     zh: '裙子',   pt: 'vestido'    } },

  // ── Family ────────────────────────────────────────────────────────────────
  { word: 'baby',      emoji: '👶', imageQuery: 'cute,baby,smile',          translations: { he: 'תינוק',    es: 'bebé',       fr: 'bébé',        de: 'Baby',       ar: 'طفل',      ru: 'малыш',      zh: '婴儿',   pt: 'bebê'       } },
  { word: 'family',    emoji: '👨‍👩‍👧‍👦', imageQuery: 'happy,family,together',  translations: { he: 'משפחה',    es: 'familia',    fr: 'famille',     de: 'Familie',    ar: 'عائلة',    ru: 'семья',      zh: '家庭',   pt: 'família'    } },
]

export const LANGUAGES = [
  { code: 'he', label: 'עברית',     flag: '🇮🇱', speechCode: 'he-IL' },
  { code: 'es', label: 'Español',   flag: '🇪🇸', speechCode: 'en-US' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷', speechCode: 'en-US' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪', speechCode: 'en-US' },
  { code: 'ar', label: 'عربية',    flag: '🇸🇦', speechCode: 'en-US' },
  { code: 'ru', label: 'Русский',   flag: '🇷🇺', speechCode: 'en-US' },
  { code: 'zh', label: '中文',      flag: '🇨🇳', speechCode: 'en-US' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', speechCode: 'en-US' },
]
