import { NAME_SHEET_ASD, NAME_SHEET_OLMA, START_ROW_IN_FILE_ASD, START_ROW_IN_FILE_OLMA } from "./constants";

export const detectCompany = (fileName) => {
    let decoding;
    let startRow;
    let sheetName;
    switch (fileName) {
        case 'Table_1c_olma.xls':
            // console.log(`название файла Table_1c_olma.xls ${fileName}`);
            decoding = true;
            startRow = START_ROW_IN_FILE_OLMA;
            sheetName = NAME_SHEET_OLMA;
            break;
        case 'Table_1c_asd.xlsx':
            // console.log(`название файла Table_1c_asd.xlsx ${fileName}`);
            decoding = false;
            startRow = START_ROW_IN_FILE_ASD;
            sheetName = NAME_SHEET_ASD;
            break;
        default:
            console.log(`Неверное название файла ${fileName}`);
            break;
    }

    return { startRow, sheetName, decoding };
};

export function customRound(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export function extractPhoneNumbers(str) {
    // Приводим строку к массиву из номеров '8-951-204-09-33', '444-33-11'...;

    // eslint-disable-next-line no-useless-escape
    const parts = str.match(/(?:\+|\d)[\d\-\(\) ]{7,}\d/g);

    if (!parts) {
        console.log('массив номеров не создан, в строке нет номеров');
        return null;
    }

    //Начинается с: "+" или цифры
    //Потом может содержать: цифры, "-", "(", ")", пробел. Повторяющиеся 7 и больше раз
    //Заканчивается цифрой

    const result = [];    

    for (const part of parts) {
        // Извлекаем все цифры из текущей части
        const digits = part.replace(/\D/g, '');
        // Проверяем, что длина последовательности больше 5
        if (digits.length >= 7) {
            let number = digits;
            // Обрезаем до 10 цифр, оставляя только правую часть числа
            if (number.length > 10) {
                number = number.slice(-10);
            }
            result.push(number);
        }
    }
    // console.log(result);

    return result;
}

export function fullingDate(numShortDate) { 
  	let strShortDate = numShortDate.toString()
    if (strShortDate.length === 5) {
      strShortDate = "0" + strShortDate
    }
    const shortYear = strShortDate.slice(-2);
    const dateAndMonth = strShortDate.slice(0, 4);
    const fullDate = dateAndMonth + '20' + shortYear;
    const fullDateWithPoints = fullDate.slice(0, 2) + "." + fullDate.slice(2, 4) + "." + fullDate.slice(-4);
    return fullDateWithPoints;
};
