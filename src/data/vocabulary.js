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
  { word: 'family',   emoji: '👨‍👩‍👧‍👦', imageQuery: 'happy,family,together',   translations: { he: 'משפחה',    es: 'familia',    fr: 'famille',     de: 'Familie',    ar: 'عائلة',    ru: 'семья',      zh: '家庭',   pt: 'família'    } },
  { word: 'boy',      emoji: '👦', imageQuery: 'happy,boy,child',          translations: { he: 'ילד',      es: 'niño',       fr: 'garçon',      de: 'Junge',      ar: 'ولد',      ru: 'мальчик',    zh: '男孩',   pt: 'menino'     } },
  { word: 'girl',     emoji: '👧', imageQuery: 'happy,girl,child',         translations: { he: 'ילדה',     es: 'niña',       fr: 'fille',       de: 'Mädchen',    ar: 'بنت',      ru: 'девочка',    zh: '女孩',   pt: 'menina'     } },
  { word: 'friend',   emoji: '👫', imageQuery: 'children,friends,playing', translations: { he: 'חבר',      es: 'amigo',      fr: 'ami',         de: 'Freund',     ar: 'صديق',     ru: 'друг',       zh: '朋友',   pt: 'amigo'      } },

  // ── Musical Instruments ───────────────────────────────────────────────────
  { word: 'drum',      emoji: '🥁', imageQuery: 'drum,music,beat',          translations: { he: 'תוף',      es: 'tambor',     fr: 'tambour',     de: 'Trommel',    ar: 'طبل',      ru: 'барабан',    zh: '鼓',     pt: 'tambor'     } },
  { word: 'guitar',    emoji: '🎸', imageQuery: 'guitar,colorful,music',    translations: { he: 'גיטרה',    es: 'guitarra',   fr: 'guitare',     de: 'Gitarre',    ar: 'غيتار',    ru: 'гитара',     zh: '吉他',   pt: 'violão'     } },
  { word: 'piano',     emoji: '🎹', imageQuery: 'piano,keys,music',         translations: { he: 'פסנתר',    es: 'piano',      fr: 'piano',       de: 'Klavier',    ar: 'بيانو',    ru: 'пианино',    zh: '钢琴',   pt: 'piano'      } },

  // ── Places ────────────────────────────────────────────────────────────────
  { word: 'beach',     emoji: '🏖️', imageQuery: 'sunny,beach,sand',         translations: { he: 'חוף ים',   es: 'playa',      fr: 'plage',       de: 'Strand',     ar: 'شاطئ',     ru: 'пляж',       zh: '海滩',   pt: 'praia'      } },
  { word: 'farm',      emoji: '🚜', imageQuery: 'green,farm,countryside',   translations: { he: 'חווה',     es: 'granja',     fr: 'ferme',       de: 'Bauernhof',  ar: 'مزرعة',    ru: 'ферма',      zh: '农场',   pt: 'fazenda'    } },
  { word: 'park',      emoji: '🌳', imageQuery: 'park,playground,children', translations: { he: 'פארק',     es: 'parque',     fr: 'parc',        de: 'Park',       ar: 'حديقة',    ru: 'парк',       zh: '公园',   pt: 'parque'     } },
  { word: 'school',    emoji: '🏫', imageQuery: 'school,building,colorful', translations: { he: 'בית ספר',  es: 'escuela',    fr: 'école',       de: 'Schule',     ar: 'مدرسة',    ru: 'школа',      zh: '学校',   pt: 'escola'     } },
  { word: 'zoo',       emoji: '🦁', imageQuery: 'zoo,animals,children',     translations: { he: 'גן חיות',  es: 'zoológico',  fr: 'zoo',         de: 'Zoo',        ar: 'حديقة حيوان',ru: 'зоопарк',  zh: '动物园', pt: 'zoológico'  } },

  // ── Shapes ────────────────────────────────────────────────────────────────
  { word: 'circle',    emoji: '⭕', imageQuery: 'circle,shape,colorful',    translations: { he: 'עיגול',    es: 'círculo',    fr: 'cercle',      de: 'Kreis',      ar: 'دائرة',    ru: 'круг',       zh: '圆形',   pt: 'círculo'    } },
  { word: 'heart',     emoji: '❤️', imageQuery: 'red,heart,love',           translations: { he: 'לב',       es: 'corazón',    fr: 'coeur',       de: 'Herz',       ar: 'قلب',      ru: 'сердце',     zh: '心形',   pt: 'coração'    } },
  { word: 'square',    emoji: '🟥', imageQuery: 'square,shape,colorful',    translations: { he: 'ריבוע',    es: 'cuadrado',   fr: 'carré',       de: 'Quadrat',    ar: 'مربع',     ru: 'квадрат',    zh: '正方形', pt: 'quadrado'   } },
  { word: 'triangle',  emoji: '🔺', imageQuery: 'triangle,shape,colorful',  translations: { he: 'משולש',    es: 'triángulo',  fr: 'triangle',    de: 'Dreieck',    ar: 'مثلث',     ru: 'треугольник',zh: '三角形', pt: 'triângulo'  } },

  // ── Weather ───────────────────────────────────────────────────────────────
  { word: 'cold',      emoji: '🥶', imageQuery: 'cold,winter,snow',         translations: { he: 'קר',       es: 'frío',       fr: 'froid',       de: 'kalt',       ar: 'بارد',     ru: 'холодный',   zh: '冷',     pt: 'frio'       } },
  { word: 'hot',       emoji: '🌡️', imageQuery: 'hot,summer,sun',           translations: { he: 'חם',       es: 'caliente',   fr: 'chaud',       de: 'heiß',       ar: 'حار',      ru: 'горячий',    zh: '热',     pt: 'quente'     } },

  // ── More Animals ──────────────────────────────────────────────────────────
  { word: 'snake',     emoji: '🐍', imageQuery: 'colorful,snake,reptile',   translations: { he: 'נחש',      es: 'serpiente',  fr: 'serpent',     de: 'Schlange',   ar: 'ثعبان',    ru: 'змея',       zh: '蛇',     pt: 'cobra'      } },
  { word: 'tiger',     emoji: '🐯', imageQuery: 'tiger,stripes,wild',       translations: { he: 'טיגריס',   es: 'tigre',      fr: 'tigre',       de: 'Tiger',      ar: 'نمر',      ru: 'тигр',       zh: '老虎',   pt: 'tigre'      } },
  { word: 'giraffe',   emoji: '🦒', imageQuery: 'giraffe,tall,wild',        translations: { he: "ג'ירפה",   es: 'jirafa',     fr: 'girafe',      de: 'Giraffe',    ar: 'زرافة',    ru: 'жираф',      zh: '长颈鹿', pt: 'girafa'     } },
  { word: 'penguin',   emoji: '🐧', imageQuery: 'penguin,cute,arctic',      translations: { he: 'פינגווין', es: 'pingüino',   fr: 'pingouin',    de: 'Pinguin',    ar: 'بطريق',    ru: 'пингвин',    zh: '企鹅',   pt: 'pinguim'    } },
  { word: 'bee',       emoji: '🐝', imageQuery: 'bee,flower,honey',         translations: { he: 'דבורה',    es: 'abeja',      fr: 'abeille',     de: 'Biene',      ar: 'نحلة',     ru: 'пчела',      zh: '蜜蜂',   pt: 'abelha'     } },
  { word: 'owl',       emoji: '🦉', imageQuery: 'owl,wise,night',           translations: { he: 'ינשוף',    es: 'búho',       fr: 'hibou',       de: 'Eule',       ar: 'بومة',     ru: 'сова',       zh: '猫头鹰', pt: 'coruja'     } },
  { word: 'whale',     emoji: '🐳', imageQuery: 'whale,ocean,blue',         translations: { he: 'לוויתן',   es: 'ballena',    fr: 'baleine',     de: 'Wal',        ar: 'حوت',      ru: 'кит',        zh: '鲸鱼',   pt: 'baleia'     } },
  { word: 'zebra',     emoji: '🦓', imageQuery: 'zebra,stripes,wild',       translations: { he: 'זברה',     es: 'cebra',      fr: 'zèbre',       de: 'Zebra',      ar: 'حمار وحشي',ru: 'зебра',      zh: '斑马',   pt: 'zebra'      } },
  { word: 'wolf',      emoji: '🐺', imageQuery: 'wolf,forest,wild',         translations: { he: 'זאב',      es: 'lobo',       fr: 'loup',        de: 'Wolf',       ar: 'ذئب',      ru: 'волк',       zh: '狼',     pt: 'lobo'       } },
  { word: 'fox',       emoji: '🦊', imageQuery: 'fox,cute,orange',          translations: { he: 'שועל',     es: 'zorro',      fr: 'renard',      de: 'Fuchs',      ar: 'ثعلب',     ru: 'лиса',       zh: '狐狸',   pt: 'raposa'     } },
  { word: 'chicken',   emoji: '🐔', imageQuery: 'chicken,farm,cute',        translations: { he: 'תרנגולת',  es: 'gallina',    fr: 'poulet',      de: 'Huhn',       ar: 'دجاجة',    ru: 'курица',     zh: '鸡',     pt: 'galinha'    } },
  { word: 'camel',     emoji: '🐪', imageQuery: 'camel,desert,sand',        translations: { he: 'גמל',      es: 'camello',    fr: 'chameau',     de: 'Kamel',      ar: 'جمل',      ru: 'верблюд',    zh: '骆驼',   pt: 'camelo'     } },
  { word: 'crocodile', emoji: '🐊', imageQuery: 'crocodile,green,river',    translations: { he: 'תנין',     es: 'cocodrilo',  fr: 'crocodile',   de: 'Krokodil',   ar: 'تمساح',    ru: 'крокодил',   zh: '鳄鱼',   pt: 'crocodilo'  } },
  { word: 'deer',      emoji: '🦌', imageQuery: 'deer,forest,wild',         translations: { he: 'איל',      es: 'ciervo',     fr: 'cerf',        de: 'Hirsch',     ar: 'غزال',     ru: 'олень',      zh: '鹿',     pt: 'cervo'      } },
  { word: 'dolphin',   emoji: '🐬', imageQuery: 'dolphin,ocean,jump',       translations: { he: 'דולפין',   es: 'delfín',     fr: 'dauphin',     de: 'Delfin',     ar: 'دولفين',   ru: 'дельфин',    zh: '海豚',   pt: 'golfinho'   } },
  { word: 'parrot',    emoji: '🦜', imageQuery: 'colorful,parrot,bird',     translations: { he: 'תוכי',     es: 'loro',       fr: 'perroquet',   de: 'Papagei',    ar: 'ببغاء',    ru: 'попугай',    zh: '鹦鹉',   pt: 'papagaio'   } },
  { word: 'shark',     emoji: '🦈', imageQuery: 'shark,ocean,blue',         translations: { he: 'כריש',     es: 'tiburón',    fr: 'requin',      de: 'Hai',        ar: 'قرش',      ru: 'акула',      zh: '鲨鱼',   pt: 'tubarão'    } },
  { word: 'spider',    emoji: '🕷️', imageQuery: 'spider,web,nature',        translations: { he: 'עכביש',    es: 'araña',      fr: 'araignée',    de: 'Spinne',     ar: 'عنكبوت',   ru: 'паук',       zh: '蜘蛛',   pt: 'aranha'     } },

  // ── More Food & Drink ─────────────────────────────────────────────────────
  { word: 'grapes',    emoji: '🍇', imageQuery: 'purple,grapes,fruit',      translations: { he: 'ענבים',    es: 'uvas',       fr: 'raisins',     de: 'Trauben',    ar: 'عنب',      ru: 'виноград',   zh: '葡萄',   pt: 'uvas'       } },
  { word: 'watermelon',emoji: '🍉', imageQuery: 'watermelon,red,summer',    translations: { he: 'אבטיח',    es: 'sandía',     fr: 'pastèque',    de: 'Wassermelone',ar: 'بطيخ',    ru: 'арбуз',      zh: '西瓜',   pt: 'melancia'   } },
  { word: 'lemon',     emoji: '🍋', imageQuery: 'lemon,yellow,citrus',      translations: { he: 'לימון',    es: 'limón',      fr: 'citron',      de: 'Zitrone',    ar: 'ليمون',    ru: 'лимон',      zh: '柠檬',   pt: 'limão'      } },
  { word: 'corn',      emoji: '🌽', imageQuery: 'corn,yellow,vegetable',    translations: { he: 'תירס',     es: 'maíz',       fr: 'maïs',        de: 'Mais',       ar: 'ذرة',      ru: 'кукуруза',   zh: '玉米',   pt: 'milho'      } },
  { word: 'ice cream', emoji: '🍦', imageQuery: 'icecream,colorful,sweet',  translations: { he: 'גלידה',    es: 'helado',     fr: 'glace',       de: 'Eis',        ar: 'آيس كريم', ru: 'мороженое',  zh: '冰淇淋', pt: 'sorvete'    } },
  { word: 'cookie',    emoji: '🍪', imageQuery: 'cookie,sweet,baked',       translations: { he: 'עוגייה',   es: 'galleta',    fr: 'biscuit',     de: 'Keks',       ar: 'بسكويت',   ru: 'печенье',    zh: '饼干',   pt: 'biscoito'   } },
  { word: 'chocolate', emoji: '🍫', imageQuery: 'chocolate,dark,sweet',     translations: { he: 'שוקולד',   es: 'chocolate',  fr: 'chocolat',    de: 'Schokolade', ar: 'شوكولاتة', ru: 'шоколад',    zh: '巧克力', pt: 'chocolate'  } },
  { word: 'cherry',    emoji: '🍒', imageQuery: 'red,cherry,fruit',         translations: { he: 'דובדבן',   es: 'cereza',     fr: 'cerise',      de: 'Kirsche',    ar: 'كرز',      ru: 'вишня',      zh: '樱桃',   pt: 'cereja'     } },
  { word: 'mango',     emoji: '🥭', imageQuery: 'mango,tropical,fruit',     translations: { he: 'מנגו',     es: 'mango',      fr: 'mangue',      de: 'Mango',      ar: 'مانجو',    ru: 'манго',      zh: '芒果',   pt: 'manga'      } },
  { word: 'mushroom',  emoji: '🍄', imageQuery: 'mushroom,forest,nature',   translations: { he: 'פטרייה',   es: 'hongo',      fr: 'champignon',  de: 'Pilz',       ar: 'فطر',      ru: 'гриб',       zh: '蘑菇',   pt: 'cogumelo'   } },
  { word: 'pineapple', emoji: '🍍', imageQuery: 'pineapple,tropical,fruit', translations: { he: 'אננס',     es: 'piña',       fr: 'ananas',      de: 'Ananas',     ar: 'أناناس',   ru: 'ананас',     zh: '菠萝',   pt: 'abacaxi'    } },
  { word: 'potato',    emoji: '🥔', imageQuery: 'potato,vegetable,food',    translations: { he: 'תפוח אדמה',es: 'patata',     fr: 'pomme de terre',de: 'Kartoffel', ar: 'بطاطا',    ru: 'картофель',  zh: '土豆',   pt: 'batata'     } },
  { word: 'rice',      emoji: '🍚', imageQuery: 'white,rice,bowl',          translations: { he: 'אורז',     es: 'arroz',      fr: 'riz',         de: 'Reis',       ar: 'أرز',      ru: 'рис',        zh: '米饭',   pt: 'arroz'      } },
  { word: 'tomato',    emoji: '🍅', imageQuery: 'red,tomato,vegetable',     translations: { he: 'עגבנייה',  es: 'tomate',     fr: 'tomate',      de: 'Tomate',     ar: 'طماطم',    ru: 'помидор',    zh: '西红柿', pt: 'tomate'     } },

  // ── More Colors ───────────────────────────────────────────────────────────
  { word: 'brown',     emoji: '🟤', imageQuery: 'brown,color,earth',        translations: { he: 'חום',      es: 'marrón',     fr: 'marron',      de: 'braun',      ar: 'بني',      ru: 'коричневый', zh: '棕色',   pt: 'marrom'     } },
  { word: 'gray',      emoji: '🩶', imageQuery: 'gray,color,stone',         translations: { he: 'אפור',     es: 'gris',       fr: 'gris',        de: 'grau',       ar: 'رمادي',    ru: 'серый',      zh: '灰色',   pt: 'cinza'      } },

  // ── More Body Parts ───────────────────────────────────────────────────────
  { word: 'foot',      emoji: '🦶', imageQuery: 'foot,barefoot,beach',      translations: { he: 'כף רגל',   es: 'pie',        fr: 'pied',        de: 'Fuß',        ar: 'قدم',      ru: 'ступня',     zh: '脚',     pt: 'pé'         } },
  { word: 'arm',       emoji: '💪', imageQuery: 'arm,strong,muscle',        translations: { he: 'זרוע',     es: 'brazo',      fr: 'bras',        de: 'Arm',        ar: 'ذراع',     ru: 'рука',       zh: '手臂',   pt: 'braço'      } },
  { word: 'finger',    emoji: '👆', imageQuery: 'finger,hand,pointing',     translations: { he: 'אצבע',     es: 'dedo',       fr: 'doigt',       de: 'Finger',     ar: 'إصبع',     ru: 'палец',      zh: '手指',   pt: 'dedo'       } },
  { word: 'tooth',     emoji: '🦷', imageQuery: 'tooth,smile,white',        translations: { he: 'שן',       es: 'diente',     fr: 'dent',        de: 'Zahn',       ar: 'سن',       ru: 'зуб',        zh: '牙齿',   pt: 'dente'      } },

  // ── More Actions ──────────────────────────────────────────────────────────
  { word: 'eat',       emoji: '🍽️', imageQuery: 'child,eating,food',        translations: { he: 'לאכול',    es: 'comer',      fr: 'manger',      de: 'essen',      ar: 'يأكل',     ru: 'есть',       zh: '吃',     pt: 'comer'      } },
  { word: 'drink',     emoji: '🥤', imageQuery: 'child,drinking,juice',      translations: { he: 'לשתות',    es: 'beber',      fr: 'boire',       de: 'trinken',    ar: 'يشرب',     ru: 'пить',       zh: '喝',     pt: 'beber'      } },
  { word: 'read',      emoji: '📖', imageQuery: 'child,reading,book',        translations: { he: 'לקרוא',    es: 'leer',       fr: 'lire',        de: 'lesen',      ar: 'يقرأ',     ru: 'читать',     zh: '读',     pt: 'ler'        } },
  { word: 'play',      emoji: '🎮', imageQuery: 'children,playing,fun',      translations: { he: 'לשחק',     es: 'jugar',      fr: 'jouer',       de: 'spielen',    ar: 'يلعب',     ru: 'играть',     zh: '玩',     pt: 'brincar'    } },
  { word: 'walk',      emoji: '🚶', imageQuery: 'child,walking,park',        translations: { he: 'ללכת',     es: 'caminar',    fr: 'marcher',     de: 'gehen',      ar: 'يمشي',     ru: 'идти',       zh: '走',     pt: 'andar'      } },
  { word: 'fly',       emoji: '🕊️', imageQuery: 'bird,flying,sky',           translations: { he: 'לעוף',     es: 'volar',      fr: 'voler',       de: 'fliegen',    ar: 'يطير',     ru: 'летать',     zh: '飞',     pt: 'voar'       } },
  { word: 'build',     emoji: '🏗️', imageQuery: 'child,building,blocks',     translations: { he: 'לבנות',    es: 'construir',  fr: 'construire',  de: 'bauen',      ar: 'يبني',     ru: 'строить',    zh: '建造',   pt: 'construir'  } },
  { word: 'catch',     emoji: '🤲', imageQuery: 'child,catching,ball',       translations: { he: 'לתפוס',    es: 'atrapar',    fr: 'attraper',    de: 'fangen',     ar: 'يمسك',     ru: 'ловить',     zh: '接住',   pt: 'pegar'      } },
  { word: 'climb',     emoji: '🧗', imageQuery: 'child,climbing,tree',       translations: { he: 'לטפס',     es: 'trepar',     fr: 'grimper',     de: 'klettern',   ar: 'يتسلق',    ru: 'лазить',     zh: '爬',     pt: 'escalar'    } },
  { word: 'close',     emoji: '🚪', imageQuery: 'door,closing,shut',         translations: { he: 'לסגור',    es: 'cerrar',     fr: 'fermer',      de: 'schließen',  ar: 'يغلق',     ru: 'закрывать',  zh: '关',     pt: 'fechar'     } },
  { word: 'cook',      emoji: '🍳', imageQuery: 'cooking,kitchen,food',      translations: { he: 'לבשל',     es: 'cocinar',    fr: 'cuisiner',    de: 'kochen',     ar: 'يطبخ',     ru: 'готовить',   zh: '烹饪',   pt: 'cozinhar'   } },
  { word: 'laugh',     emoji: '😄', imageQuery: 'child,laughing,happy',      translations: { he: 'לצחוק',    es: 'reír',       fr: 'rire',        de: 'lachen',     ar: 'يضحك',     ru: 'смеяться',   zh: '笑',     pt: 'rir'        } },
  { word: 'open',      emoji: '📂', imageQuery: 'open,door,entrance',        translations: { he: 'לפתוח',    es: 'abrir',      fr: 'ouvrir',      de: 'öffnen',     ar: 'يفتح',     ru: 'открывать',  zh: '开',     pt: 'abrir'      } },
  { word: 'throw',     emoji: '🎯', imageQuery: 'child,throwing,ball',       translations: { he: 'לזרוק',    es: 'lanzar',     fr: 'lancer',      de: 'werfen',     ar: 'يرمي',     ru: 'бросать',    zh: '扔',     pt: 'lançar'     } },

  // ── More Nature ───────────────────────────────────────────────────────────
  { word: 'river',     emoji: '🏞️', imageQuery: 'blue,river,nature',        translations: { he: 'נהר',      es: 'río',        fr: 'rivière',     de: 'Fluss',      ar: 'نهر',      ru: 'река',       zh: '河流',   pt: 'rio'        } },
  { word: 'wind',      emoji: '💨', imageQuery: 'wind,breeze,nature',        translations: { he: 'רוח',      es: 'viento',     fr: 'vent',        de: 'Wind',       ar: 'ريح',      ru: 'ветер',      zh: '风',     pt: 'vento'      } },
  { word: 'grass',     emoji: '🌿', imageQuery: 'green,grass,field',         translations: { he: 'דשא',      es: 'hierba',     fr: 'herbe',       de: 'Gras',       ar: 'عشب',      ru: 'трава',      zh: '草',     pt: 'grama'      } },

  // ── More Home & Objects ───────────────────────────────────────────────────
  { word: 'bed',       emoji: '🛏️', imageQuery: 'cozy,bed,bedroom',         translations: { he: 'מיטה',     es: 'cama',       fr: 'lit',         de: 'Bett',       ar: 'سرير',     ru: 'кровать',    zh: '床',     pt: 'cama'       } },
  { word: 'window',    emoji: '🪟', imageQuery: 'colorful,window,house',     translations: { he: 'חלון',     es: 'ventana',    fr: 'fenêtre',     de: 'Fenster',    ar: 'نافذة',    ru: 'окно',       zh: '窗户',   pt: 'janela'     } },
  { word: 'phone',     emoji: '📱', imageQuery: 'smartphone,colorful,tech',  translations: { he: 'טלפון',    es: 'teléfono',   fr: 'téléphone',   de: 'Telefon',    ar: 'هاتف',     ru: 'телефон',    zh: '电话',   pt: 'telefone'   } },
  { word: 'cup',       emoji: '☕', imageQuery: 'colorful,cup,mug',          translations: { he: 'כוס',      es: 'taza',       fr: 'tasse',       de: 'Tasse',      ar: 'كوب',      ru: 'кружка',     zh: '杯子',   pt: 'xícara'     } },
  { word: 'toy',       emoji: '🧸', imageQuery: 'colorful,toy,children',     translations: { he: 'צעצוע',    es: 'juguete',    fr: 'jouet',       de: 'Spielzeug',  ar: 'لعبة',     ru: 'игрушка',    zh: '玩具',   pt: 'brinquedo'  } },
  { word: 'key',       emoji: '🔑', imageQuery: 'golden,key,door',           translations: { he: 'מפתח',     es: 'llave',      fr: 'clé',         de: 'Schlüssel',  ar: 'مفتاح',    ru: 'ключ',       zh: '钥匙',   pt: 'chave'      } },

  // ── More Transport ────────────────────────────────────────────────────────
  { word: 'bus',       emoji: '🚌', imageQuery: 'yellow,bus,school',         translations: { he: 'אוטובוס',  es: 'autobús',    fr: 'bus',         de: 'Bus',        ar: 'حافلة',    ru: 'автобус',    zh: '公共汽车',pt: 'ônibus'    } },
  { word: 'bicycle',   emoji: '🚲', imageQuery: 'colorful,bicycle,riding',   translations: { he: 'אופניים',  es: 'bicicleta',  fr: 'vélo',        de: 'Fahrrad',    ar: 'دراجة',    ru: 'велосипед',  zh: '自行车', pt: 'bicicleta'  } },
  { word: 'truck',     emoji: '🚚', imageQuery: 'big,truck,road',            translations: { he: 'משאית',    es: 'camión',     fr: 'camion',      de: 'Lastwagen',  ar: 'شاحنة',    ru: 'грузовик',   zh: '卡车',   pt: 'caminhão'   } },
  { word: 'rocket',    emoji: '🚀', imageQuery: 'rocket,space,launch',       translations: { he: 'רקטה',     es: 'cohete',     fr: 'fusée',       de: 'Rakete',     ar: 'صاروخ',    ru: 'ракета',     zh: '火箭',   pt: 'foguete'    } },

  // ── More Clothing ─────────────────────────────────────────────────────────
  { word: 'shirt',     emoji: '👕', imageQuery: 'colorful,shirt,clothing',   translations: { he: 'חולצה',    es: 'camisa',     fr: 'chemise',     de: 'Hemd',       ar: 'قميص',     ru: 'рубашка',    zh: '衬衫',   pt: 'camisa'     } },
  { word: 'pants',     emoji: '👖', imageQuery: 'jeans,pants,clothing',      translations: { he: 'מכנסיים',  es: 'pantalones', fr: 'pantalon',    de: 'Hose',       ar: 'بنطال',    ru: 'брюки',      zh: '裤子',   pt: 'calça'      } },
  { word: 'sock',      emoji: '🧦', imageQuery: 'colorful,socks,fun',        translations: { he: 'גרב',      es: 'calcetín',   fr: 'chaussette',  de: 'Socke',      ar: 'جورب',     ru: 'носок',      zh: '袜子',   pt: 'meia'       } },
  { word: 'coat',      emoji: '🧥', imageQuery: 'warm,coat,winter',          translations: { he: 'מעיל',     es: 'abrigo',     fr: 'manteau',     de: 'Mantel',     ar: 'معطف',     ru: 'пальто',     zh: '外套',   pt: 'casaco'     } },

  // ── Feelings ──────────────────────────────────────────────────────────────
  { word: 'happy',     emoji: '😊', imageQuery: 'child,happy,smile',         translations: { he: 'שמח',      es: 'feliz',      fr: 'heureux',     de: 'glücklich',  ar: 'سعيد',     ru: 'счастливый', zh: '快乐',   pt: 'feliz'      } },
  { word: 'sad',       emoji: '😢', imageQuery: 'child,sad,upset',           translations: { he: 'עצוב',     es: 'triste',     fr: 'triste',      de: 'traurig',    ar: 'حزين',     ru: 'грустный',   zh: '悲伤',   pt: 'triste'     } },
  { word: 'angry',     emoji: '😠', imageQuery: 'child,angry,expression',    translations: { he: 'כועס',     es: 'enojado',    fr: 'en colère',   de: 'wütend',     ar: 'غاضب',     ru: 'злой',       zh: '生气',   pt: 'bravo'      } },
  { word: 'scared',    emoji: '😨', imageQuery: 'child,scared,surprised',    translations: { he: 'מפוחד',    es: 'asustado',   fr: 'effrayé',     de: 'ängstlich',  ar: 'خائف',     ru: 'испуганный', zh: '害怕',   pt: 'assustado'  } },
]

// ── Challenge categories ────────────────────────────────────────────────────
// Words grouped by theme, used to pick plausible wrong answers (distractors)
// for the tap-the-picture challenge. The "More X" sections are merged into
// their base category. A word missing from this map simply falls back to
// random distractors, so the game still works if a new word isn't added here.
export const CATEGORIES = {
  animals:     ['cat','dog','fish','bird','duck','frog','horse','cow','pig','sheep','bear','lion','monkey','elephant','rabbit','butterfly','turtle','snake','tiger','giraffe','penguin','bee','owl','whale','zebra','wolf','fox','chicken','camel','crocodile','deer','dolphin','parrot','shark','spider'],
  food:        ['apple','banana','orange','strawberry','bread','milk','egg','cake','pizza','cheese','carrot','soup','juice','water','grapes','watermelon','lemon','corn','ice cream','cookie','chocolate','cherry','mango','mushroom','pineapple','potato','rice','tomato'],
  colors:      ['red','blue','green','yellow','pink','purple','white','black','brown','gray'],
  body:        ['eye','nose','mouth','ear','hand','head','hair','leg','foot','arm','finger','tooth'],
  actions:     ['run','jump','swim','sing','dance','sleep','draw','eat','drink','read','play','walk','fly','build','catch','climb','close','cook','laugh','open','throw'],
  nature:      ['sun','moon','star','cloud','rain','snow','fire','flower','tree','sea','rainbow','mountain','river','wind','grass'],
  home:        ['house','door','table','chair','book','clock','pencil','ball','bed','window','phone','cup','toy','key'],
  transport:   ['car','boat','train','plane','bus','bicycle','truck','rocket'],
  clothing:    ['hat','shoe','dress','shirt','pants','sock','coat'],
  family:      ['baby','family','boy','girl','friend'],
  instruments: ['drum','guitar','piano'],
  places:      ['beach','farm','park','school','zoo'],
  shapes:      ['circle','heart','square','triangle'],
  weather:     ['cold','hot'],
  feelings:    ['happy','sad','angry','scared'],
}

const WORD_TO_CATEGORY = (() => {
  const map = {}
  for (const [cat, words] of Object.entries(CATEGORIES)) {
    for (const w of words) map[w] = cat
  }
  return map
})()

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Build the option set for a tap-the-picture challenge: the target word plus
 * (count - 1) distractors. Distractors come from the same category when
 * possible, falling back to random words for tiny categories. Every option has
 * a visually distinct emoji so the choices are always distinguishable. The
 * result is shuffled so the correct answer isn't always in the same position.
 */
export function getChallengeOptions(targetWord, count = 3) {
  const target = vocabulary.find(v => v.word === targetWord)
  if (!target) return []

  const chosen = [target]
  const usedEmojis = new Set([target.emoji])

  const addFrom = (words) => {
    for (const w of words) {
      if (chosen.length >= count) break
      const entry = vocabulary.find(v => v.word === w)
      if (!entry || entry.word === targetWord) continue
      if (chosen.some(c => c.word === entry.word)) continue
      if (usedEmojis.has(entry.emoji)) continue   // keep all emojis distinct
      chosen.push(entry)
      usedEmojis.add(entry.emoji)
    }
  }

  // Prefer same-category distractors…
  const cat = WORD_TO_CATEGORY[targetWord]
  if (cat) addFrom(shuffle(CATEGORIES[cat]))

  // …then top up with random words if the category was too small.
  if (chosen.length < count) addFrom(shuffle(vocabulary.map(v => v.word)))

  return shuffle(chosen)
}

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
