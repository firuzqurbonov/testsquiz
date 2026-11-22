export const brand = 'Роҳ ба сӯи маърифат';

export const demoCourses = [
  {
    id: 'python',
    title: 'Асосҳои Python',
    description: 'Бо тағйирёбандаҳо, ададҳо ва фармонҳои воридоту барориш шинос шавед.',
    modules: [
      { id: 'intro', title: 'Қадамҳои аввал', tasks: [
        { id: 'hello', title: 'Салом, ҷаҳон!' },
        { id: 'sum', title: 'Ҷамъи ду адад' },
      ] },
      { id: 'types', title: 'Навъҳои додаҳо', tasks: [
        { id: 'number', title: 'Ададҳо ва сатрҳо' },
      ] },
    ],
  },
  {
    id: 'loops',
    title: 'Шартҳо ва даврҳо',
    description: 'Қароргириро дар барнома омӯзед ва амалҳоро бо даврҳо такрор кунед.',
    modules: [
      { id: 'conditions', title: 'Шартҳо', tasks: [{ id: 'even', title: 'Ҷуфт ё тоқ' }] },
      { id: 'cycles', title: 'Даврҳои for ва while', tasks: [{ id: 'range', title: 'Ҳисоби ададҳо' }] },
    ],
  },
  {
    id: 'functions',
    title: 'Функсияҳо ва рӯйхатҳо',
    description: 'Кодро ба қисмҳои хурд ҷудо кунед ва бо маҷмӯи додаҳо кор кунед.',
    modules: [
      { id: 'lists', title: 'Рӯйхатҳо', tasks: [{ id: 'maximum', title: 'Адади калонтарин' }] },
      { id: 'functions', title: 'Сохтани функсияҳо', tasks: [{ id: 'return', title: 'Баргардонидани натиҷа' }] },
    ],
  },
];

export const verdicts = {
  accepted: { label: 'Қабул шуд', tone: 'success', detail: 'Ҳал аз ҳамаи санҷишҳо гузашт.' },
  wrong_answer: { label: 'Ҷавоби нодуруст', tone: 'warning', detail: 'Натиҷа бо ҷавоби интизорӣ мувофиқат накард.' },
  error: { label: 'Хатои иҷро', tone: 'error', detail: 'Ҳангоми санҷиши код хато ба амал омад.' },
  time_limit: { label: 'Вақт тамом шуд', tone: 'warning', detail: 'Иҷро аз вақти иҷозашуда зиёд шуд.' },
};

export const guide = [
  { title: 'Курсро интихоб кунед', text: 'Модулҳои курсро кушоед ва масъалаи дилхоҳатонро хонед.' },
  { title: 'Ҳалли худро нависед', text: 'Коди Python-ро дар муҳаррир нависед ва барои санҷиш фиристед.' },
  { title: 'Натиҷаро бинед', text: 'Пас аз санҷиш натиҷа ва кӯшишҳои пешинаатонро дар «Ҳалҳои ман» пайдо мекунед.' },
];
