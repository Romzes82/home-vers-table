import { useState, useEffect, useCallback } from 'react';
import localForage from 'localforage';
import UploadFiles from './components/UploadFiles';
import DisplayData from './components/DisplayData';
import './App.css';
import { formatCompanyData, formatDeliveryData } from './utils/helpersFunctions';

// Вспомогательные функции
function extractNumbersFromString(stringWithNumbers) {
    const str = stringWithNumbers.match(/(?:\+|\d)[\d\-\(\) ]{7,}\d/g);
    // const digits = str[0].replace(/\D/g, '');
    if (!str) return [];
    const res = [];
    str.forEach((num) => res.push(num.replace(/\D/g, '')));
    return res;
    // console.log(res);
}

const processMoscowItem = async (item) => {
    // Если оба поля пустые, выходим из функции
    if (!item.S && !item.E) return;
    let url;
    let param;

    // Определяем, какой запрос делать
    if (item.S) {
        // Если item.S не пустое, используем его для запроса по ИНН
        url = 'http://localhost:8888/delivery/get-by-inn';
        param = `inn=${item.S}`;
    } else if (item.E) {
        // Если item.S пустое, но item.E не пустое, используем его для запроса по клиенту
        url = 'http://localhost:8888/delivery/get-by-client';
        param = `client=${item.E}`;
    } else {
        // Если оба поля пустые, выходим из функции
        return;
    }

    try {
        const response = await fetch(`${url}?${param}`);

        //проверка статуса ответа
        if (!response.ok) {
            return { ...item, V: [] };
        }

        const data = await response.json();
        // console.log('data')
        // console.log(data);
        return { ...item, V: formatDeliveryData(data) || [] };
    } catch (error) {
        console.error('Ошибка обработки Москвы:', error);
        return { ...item, V: [] };
        // return item;
    }
};


const processTKItem = async (item) => {
    try {
        // const numbers = extractNumbersFromString(item.L || item.M);
        const numbers = extractNumbersFromString(item.L);

        if (numbers.length === 0) return { ...item, V: [] };
        const response = await fetch(
            'http://localhost:8888/tk/get-by-numbers',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numbers }),
            }
        );
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status} ТК не найдены по массиву номеров ${numbers}`);
        }
        const result = await response.json();

        return {
            ...item,
            F: result.company || item.F,
            V: formatCompanyData(result) || [],
            Z: {
                ...item.Z,
                bid: Boolean(result.bid),
                marker: Boolean(result.marker),
            },
        };
    } catch (error) {
        console.error('Ошибка обработки ТК:', error);
        return {
            ...item,
            V: [],
            F: item.F,
            Z: item.Z,
        };
    }
};

export default function App() {
    const [tableData, setTableData] = useState([]);

    const [fileHistory, setFileHistory] = useState({
        current: [],
        previous: [],
    });

    const [tableOrder, setTableOrder] = useState([]);
    const [tkList, setTkList] = useState([]);

    // Загрузка данных при монтировании
    useEffect(() => {
        const loadData = async () => {
            const [savedData, savedHistory, savedOrder] = await Promise.all([
                localForage.getItem('tableData'),
                localForage.getItem('fileHistory'),
                localForage.getItem('tableOrder'),
            ]);
            setTableData(savedData || []);
            setFileHistory(savedHistory || { current: [], previous: [] });
            setTableOrder(savedOrder || []);
        };

        // Загрузка списка ТК с сервера

        const fetchTkList = async () => {
            try {
                const response = await fetch(
                    'http://localhost:8888/tk/get-names'
                );
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке списка ТК');
                }
                const data = await response.json();
                // setTkList(data.map((tk) => tk.name)); // Сохраняем только названия ТК
                setTkList(data);
            } catch (error) {
                console.error('Ошибка при загрузке списка ТК:', error);
            }
        };

        loadData();
        fetchTkList(); 
    }, []);

    // Сохранение данных

    useEffect(() => {
        const saveData = async () => {
            await Promise.all([
                localForage.setItem('tableData', tableData),
                localForage.setItem('fileHistory', fileHistory),
                localForage.setItem('tableOrder', tableOrder),
            ]);
        };

        saveData();
    }, [tableData, fileHistory, tableOrder]);

    const processNewItems = useCallback(async (items) => {
        return await Promise.all(
            items.map(async (item) => {
                if (item.F === 'Москва и область') {
                    return await processMoscowItem(item);
                }

                if (item.F.startsWith('тк')) {
                    return await processTKItem(item);
                }

                return item;
            })
        );
    }, []);

    const handleUpload = useCallback(
        async (newData) => {
            // Сохраняем предыдущую версию данных
            const previousData = fileHistory.current;
            // Находим удаленные строки
            const removedRows = previousData.filter(
                (prevRow) => !newData.some((newRow) => newRow.B === prevRow.B)
            );

            // Alert для удаленных строк
            if (removedRows.length > 0) {
                const removedInvoices = removedRows
                    .map((row) => row.B)
                    .join(', ');

                alert(`Удалены счета: ${removedInvoices}`);
            }

            // Подготовка базовых данных
            const baseData = newData.map((newRow) => {
                const existingRow = tableData.find((r) => r.B === newRow.B);

                if (existingRow) {
                    const YValue =
                        existingRow.Y?.trim() !== '' &&
                        existingRow.Y?.trim() !== ' '
                            ? existingRow.Y
                            : existingRow.L;

                    return {
                        ...newRow,
                        F: existingRow.F,
                        V: existingRow.V,
                        W: existingRow.W,
                        X: existingRow.X,
                        Y: YValue,
                        Z: existingRow.Z,
                    };
                }

                return {
                    ...newRow,
                    Y: newRow.L || '',
                    F: newRow.F || 'loading...',
                    V: [],
                };
            });

            // Фильтруем новые элементы для обработки
            const newItems = baseData.filter(
                (item) => !tableData.some((prevItem) => prevItem.B === item.B)
            );

            // Обрабатываем новые элементы
            let processedItems = baseData;

            if (newItems.length > 0) {
                const updatedItems = await processNewItems(newItems);
                processedItems = baseData.map(
                    (item) => updatedItems.find((u) => u.B === item.B) || item
                );
            }

            // Обновляем состояние
            setTableData(processedItems);

            setFileHistory((prev) => ({
                current: newData,

                previous: prev.current,
            }));

            // Обновление порядка
            setTableOrder((prevOrder) => {
                const newIds = newData.map((row) => row.B);
                const filteredOrder = prevOrder.filter((id) =>
                    newData.some((row) => row.B === id)
                );

                return [
                    ...filteredOrder,

                    ...newIds.filter((id) => !prevOrder.includes(id)),
                ];
            });
        },
        [tableData, fileHistory.current, processNewItems]
    );

    const handleOrderChange = useCallback((newOrder) => {
        setTableOrder(newOrder);
    }, []);

    return (
        <div>
            <DisplayData
                data={tableData}
                order={tableOrder}
                onOrderChange={handleOrderChange}
                onCellChange={setTableData}
                fileHistory={fileHistory}
                tkList={tkList}
            />
            <UploadFiles onUpload={handleUpload} />
        </div>
    );
}


// const processTKItem = async (item) => {
//     try {
//         const numbers = extractNumbersFromString(item.L || item.M);
//         // console.log(numbers)
//         if (numbers.length === 0) return { ...item, V: [] };
//         const requests = numbers.map(async (num) => {
//             try {
//                 const response = await fetch(`http://localhost:8888/tk/get-by-number?number=${num}`);
               
//                 // Обрабатываем HTTP-ошибки
//                 if (!response.ok) {
//                     console.error(`Ошибка ${response.status} для номера ${num}`);
//                     return { branches: [] };
//                 }
               
//                 return await response.json();
//             } catch (error) {
//                 console.error(`Ошибка запроса для номера ${num}:`, error);
//                 return { branches: [] };
//             }
//         });

//         const results = await Promise.all(requests);
//         console.log('results')
//             console.log(results);
//         // Извлекаем адреса с fallback
//         const addresses = results.flatMap(res => res.branches || []);
     
//         // Выбираем компанию с проверкой всех результатов
//         const company = results.find(r => r?.company)?.company || item.F;
//         return {
//             ...item,
//             F: company,
//             V: addresses
//         };

//     } catch (error) {
//         console.error('Общая ошибка обработки ТК:', error);
//         return { 
//             ...item, 
//             V: [],
//             F: item.F // Сохраняем оригинальное значение при ошибке
//         };
//     }
// };

// const processTKItem = async (item) => {
//     try {
//         const numbers = extractNumbersFromString(item.L || item.M);
//         if (numbers.length === 0 || typeof numbers === 'undefined') return;
//         const requests = numbers.map((num) =>
//             fetch(`http://localhost:8888/tk/get-by-number?number=${num}`).then(
//                 (res) => res.json()
//             )
//         );
//         const results = await Promise.all(requests);
//         const addresses = results.flatMap((res) => res.branches);
//         const company = results[0]?.company || item.F;

//         return {
//             ...item,
//             F: company,
//             V: addresses,
//         };
//     } catch (error) {
//         console.error('Ошибка обработки ТК:', error);
//         return { ...item, V: [] };
//         // return item;
//     }
// };