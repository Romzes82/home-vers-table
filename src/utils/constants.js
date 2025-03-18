export const START_ROW_IN_FILE_ASD = 3;
export const START_ROW_IN_FILE_OLMA = 3;
export const NAME_FILE_ASD = "ASD";
export const NAME_FILE_OLMA = 'OLMA';
export const NAME_SHEET_ASD = 'TDSheet';
export const NAME_SHEET_OLMA = 'Sheet1';

export const TABLE_HEAD = {
    A: '№',
    B: 'Счет',
    C: 'Накладная',
    D: 'Дата отгрузки',
    E: 'Получатель',
    F: 'Тип отгрузки',
    G: 'Сумма',
    H: 'Позиций',
    I: 'Мест',
    J: 'Вес',
    K: 'Объем',
    L: 'Примечание',
    M: 'Доп.информация',
    N: 'Город',
    O: 'Телефон',
    P: 'Конт. лицо',
    Q: 'Адрес',
    R: 'Юридический Адрес',
    S: 'ИНН',
    T: 'КПП',
    U: 'Штрихкод',
    V: 'Адрес на карте',
    W: 'Плательщик',
    X: 'Паллет',
    Y: 'Проверенный коммент',
    Z: 'Стилизация'
};

// желаемый порядок столбцов
export const COLUMN_ORDER = [
    'A',
    'B',
    'E',
    'G',
    'Q',
    'W',
    'F',
    'J',
    'K',
    'X',
    'Y',
    'V',
    'L',
    'M',
    'Z',
];
// столбцы скрываемые
export const COLUMN_HIDDEN = [
    'C',
    'D',
    'H',
    'G',
    'I',
    'N',
    'O',
    'P',
    'R',
    'S',
    'T',
    'U',
    'D',
    'Z',
];

// массив кол-во паллет
export const QUANTITY_PALLET = [
    '',
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
];