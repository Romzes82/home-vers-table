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

// возвращает массив строк с инфой по филиалам ТК из получаемого объекта-ответа с сервера
export function formatCompanyData(data) {
    return data.branches.map((branch, index) => {
        // Формируем строку для телефонов
        const phonesStr =
            'тел. ' +
            data.phones[index]
                .map((phone) => {
                    const parts = [phone.phone];
                    if (phone.extension)
                        parts.push(`доб. (${phone.extension})`);
                    if (phone.note_phone) parts.push(`${phone.note_phone}`);
                    return parts.join(', ');
                })
                .join(', ');

        // Формируем строку для заметки (note)
        const noteStr = data.note[index] || '';

        // Формируем строку для координат
        const coordStr = `${data.coordinates[index].lat},${data.coordinates[index].lng}`;

        // Собираем промежуточную строку
        const parts = [noteStr, phonesStr, data.worktime[index]]
            .filter((part) => part !== '') // Убираем пустые части
            .join(', '); 

        // Собираем итоговую строку
        const partsEnd = [branch, parts, coordStr].filter(
            (part) => part !== ''
        ); // Убираем пустые части

        return partsEnd.join('; ');
    });
}


// возвращает массив строк с инфой по адресам доставки из получаемого объекта-ответа с сервера
export function formatDeliveryData(data) {
    return data.addresses.map((address, index) => {
        // Формируем строку для истории (history)
        const historyStr = data.history[index] || '';

        // Формируем строку для координат
        const coordStr = data.coordinates[index]
            ? `${data.coordinates[index].lat},${data.coordinates[index].lng}`
            : '';

        // Собираем итоговую строку
        const parts = [address, historyStr, coordStr].filter(
            (part) => part !== ''
        ); // Убираем пустые части

        return parts.join('; ');
    });
}

// export const getGroupStatus = (data, order, currentRow) => {
//     const currentF = currentRow.F?.value || currentRow.F;

//     if (!currentF)
//         return { isGrouped: true, hasAddress: false, isDuplicationTk: false };

//     const currentIndex = order.indexOf(currentRow.B);

//     // Собираем все вхождения текущей ТК с информацией о границах

//     const allEntries = order

//         .map((rowId, index) => ({
//             row: data.find((r) => r.B === rowId),

//             index,
//         }))

//         .filter((entry) => (entry.row?.F?.value || entry.row?.F) === currentF);

//     // Определяем количество групп

//     let groupCount = 0;

//     let prevHasBorder = false;

//     for (let i = 0; i < allEntries.length; i++) {
//         const hasBorder = allEntries[i].row?.V?.[0]?.includes('border-top');

//         // Новая группа если:

//         // 1. Первый элемент

//         // 2. Есть border-top (кроме первого в группе)

//         // 3. Разрыв в порядке следования

//         if (
//             i === 0 ||
//             hasBorder ||
//             allEntries[i].index !== allEntries[i - 1].index + 1
//         ) {
//             groupCount++;
//         }

//         prevHasBorder = hasBorder;
//     }

//     // Проверка адресов

//     const hasAddress = allEntries.some((entry) => entry.row.V?.length > 0);

//     // Проверка границы у текущей группы

//     const currentGroupFirstIndex = allEntries.findIndex(
//         (entry) => entry.index >= currentIndex
//     );

//     const isGrouped =
//         currentGroupFirstIndex === 0
//             ? allEntries[0].row?.V?.[0]?.includes('border-top')
//             : true;

//     return {
//         isGrouped,

//         hasAddress,

//         isDuplicationTk: groupCount > 1,
//     };
// };

export const getGroupStatus = (data, order, currentRow) => {
    console.log(currentRow.F);
    if (currentRow.F === 'Москва и область')     return {
        isGrouped: false,
        hasAddress: true,
        isDuplicationTk: false,
    };

    const currentF = currentRow.F?.value || currentRow.F;

    if (!currentF)
        return { isGrouped: true, hasAddress: false, isDuplicationTk: false };

    // Находим все строки с текущей ТК

    const allTkRows = order

        .map((rowId) => data.find((r) => r.B === rowId))

        .filter((row) => (row?.F?.value || row?.F) === currentF);

    // Группируем по наличию border-top в стиле строки

    let groups = [];

    let currentGroup = [];

    allTkRows.forEach((row, index) => {
        const hasBorder = row.V?.length > 0; // Проверяем флаг в Z

        if (index === 0 || hasBorder) {
            if (currentGroup.length > 0) groups.push(currentGroup);

            currentGroup = [row];
        } else {
            currentGroup.push(row);
        }
    });

    if (currentGroup.length > 0) groups.push(currentGroup);

    // Определяем принадлежность текущей строки к группе

    const currentGroupIndex = groups.findIndex((group) =>
        group.some((r) => r.B === currentRow.B)
    );

    // Проверяем условия

    return {
        isGrouped:
            currentGroupIndex === 0 ||
            groups[currentGroupIndex][0].V?.length > 0,

        hasAddress: allTkRows.some((r) => r.V?.length > 0),

        isDuplicationTk: groups.length > 1,
    };
};


// создаем хелпер для ?поиска отсутствующего адреса? тк в F и определения дублирование в тк в F
// export const getGroupStatus = (data, order, currentRow, originalIndex) => {
//     const currentF = currentRow.F?.value || currentRow.F;

//     if (!currentF)
//         return { isGrouped: true, hasAddress: false, isDuplicationTk: false };

//     const currentIndex = order.indexOf(currentRow.B);

//     // Границы текущей группы
//     let groupStart = currentIndex;
//     let groupEnd = currentIndex;

//     // Находим начало группы
//     while (groupStart > 0) {
//         const prevRowId = order[groupStart - 1];
//         const prevRow = data.find((r) => r.B === prevRowId);
//         if ((prevRow?.F?.value || prevRow?.F) !== currentF) break;
//         groupStart--;
//     }

//     // Находим конец группы
//     while (groupEnd < order.length - 1) {
//         const nextRowId = order[groupEnd + 1];
//         const nextRow = data.find((r) => r.B === nextRowId);
//         if ((nextRow?.F?.value || nextRow?.F) !== currentF) break;
//         groupEnd++;
//     }

//     // Проверяем наличие других вхождений ТК
//     const allTkIndices = [];
//     order.forEach((rowId, index) => {
//         const row = data.find((r) => r.B === rowId);
//         const f = row?.F?.value || row?.F;
//         if (f === currentF) allTkIndices.push(index);
//     });

//     // Определяем дублирование
//     const isDuplicationTk =
//         allTkIndices.some((index) => index < groupStart || index > groupEnd)  &&
//         allTkIndices.length > 1;

//     // Проверка верхней границы и адресов
//     const firstInGroup = data.find((r) => r.B === order[groupStart]);
//     // const isGrouped = firstInGroup?.V?.[0]?.includes('border-top');
//     const isGrouped = firstInGroup?.V?.[0] !== "";

//     // ДОБАВИТЬ в Z.borderTop

//     console.log(firstInGroup?.V?.[0]);
//     console.log(isGrouped);
//     const hasAddress = order.slice(groupStart, groupEnd + 1).some((rowId) => {
//         const row = data.find((r) => r.B === rowId);
//         return row.V?.length > 0;
//     });

//     return {
//         isGrouped,
//         hasAddress,
//         isDuplicationTk: isDuplicationTk,
//     };
// };

// создаем хелпер для поиска отсутствующего адреса тк в F
// export const getGroupStatus = (data, order, currentRow, originalIndex) => {
//     const currentF = currentRow.F?.value || currentRow.F;

//     if (!currentF) return { isGrouped: true, hasAddress: false };

//     // Получаем реальный индекс в отсортированном порядке
//     const currentIndex = order.indexOf(currentRow.B);
//     let groupStart = currentIndex;
//     let groupEnd = currentIndex;

//     // Ищем начало группы в отсортированном порядке
//     while (groupStart > 0) {
//         const prevRowId = order[groupStart - 1];
//         const prevRow = data.find((r) => r.B === prevRowId);
//         if ((prevRow.F?.value || prevRow.F) !== currentF) break;
//         groupStart--;
//     }

//     // Ищем конец группы в отсортированном порядке
//     while (groupEnd < order.length - 1) {
//         const nextRowId = order[groupEnd + 1];
//         const nextRow = data.find((r) => r.B === nextRowId);
//         if ((nextRow.F?.value || nextRow.F) !== currentF) break;
//         groupEnd++;
//     }

//     // Проверяем границу у первого элемента группы
//     const firstInGroup = data.find((r) => r.B === order[groupStart]);
//     const isGrouped = firstInGroup?.V?.[0]?.includes('border-top');

//     // Проверяем адреса во всей группе
//     const hasAddress = order
//         .slice(groupStart, groupEnd + 1)
//         .some((rowId) => {
//             const row = data.find((r) => r.B === rowId);
//             return row.V?.length > 0;
//         });

//     return { isGrouped, hasAddress };
// };

// // создаем хелпер для поиска дубликатов тк в F
// export const findUngroupedDuplicates = (data) => {
//     const tkMap = new Map();
//     const duplicates = new Set();

//     data.forEach((row, index) => {
//         const tk = row.F?.value || row.F;
//         if (!tk) return;

//         if (tkMap.has(tk)) {
//             const prevIndex = tkMap.get(tk).lastIndex;
      
//             // Проверяем группировку с предыдущим вхождением
//             const isGrouped = index === prevIndex + 1 &&
//                 data[prevIndex].V?.[0]?.includes('border-top');
     
//             if (!isGrouped) {
//                 duplicates.add(index);
//                 duplicates.add(prevIndex);
//             }
//         }
//     })
// }