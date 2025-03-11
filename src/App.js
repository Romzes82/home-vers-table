import { useState, useEffect } from 'react';
import localForage from 'localforage';
import UploadFiles from './components/UploadFiles';
import DisplayData from './components/DisplayData';
import './App.css';

export default function App() {
    const [tableData, setTableData] = useState([]);
    const [fileHistory, setFileHistory] = useState({
        current: [],
        previous: [],
    });

    const [tableOrder, setTableOrder] = useState([]);

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

        loadData();
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

    // Обработка загрузки файла

    const handleUpload = (newData) => {
        // ... существующая логика handleUpload без изменений ...
        // сохраняем предыдущую версию данных перед обновлением
        const previousData = fileHistory.current;

        // обновляем историю файлов
        setFileHistory((prev) => ({
            current: newData,
            previous: prev.current, // сохраняем предыдущую версию
        }));

        // находим удаленные строки
        const removedRows = previousData.filter(
            (prevRow) => !newData.some((newRow) => newRow.B === prevRow.B)
        );

        // alert для удаленных строк
        if (removedRows.length > 0) {
            const removedInvoices = removedRows.map((row) => row.B).join(', ');
            alert(`Удалены счета : ${removedInvoices}`);
            console.log(`Удалены счета : ${removedInvoices}`);
        }


        // изменение предыдущего состояния таблицы при handleUpload
        setTableData((prev) =>
            // допишем к пред. состоянию только новые счета
            // также надо учесть, что при наличии новых счетов, надо скоприовать единожды комментарий L в Y
            newData.map((newRow) => {
                //находим соответствующую строку в !предыдущих! данных, т.е. exisningRow - это строка объект пред.
                // данных. И так для каждой новой строки newRow
                const exisningRow = prev.find((r) => r.B === newRow.B);
                // console.log(exisningRow);
                // если строка соответсвует в предыдущих данных
                if (exisningRow) {
                    if (
                        // это проверка на пустое/пробел значение в комментарии пред. знач
                        exisningRow.Y.length !== '' ||
                        exisningRow.Y.length !== ' '
                    ) {
                        // если пред. откорректированный комментарий уже имеет строку не '' или ' ', то предыдущее значение Y сохраним
                        // в новом значении Y. Иначе в новом Y сохраняем предыдущий L
                        // console.log(exisningRow.Y);
                        return {
                            ...newRow, // берем все поля из новой строки-объекта
                            F: exisningRow.F, //сохраняем F из предыдущей версии
                            V: exisningRow.V,
                            W: exisningRow.W,
                            X: exisningRow.X,
                            Y: exisningRow.Y,
                            Z: exisningRow.Z,
                        };
                    } else {
                        return {
                            ...newRow, // берем все поля из новой строки-объекта
                            F: exisningRow.F, //сохраняем F из предыдущей версии
                            V: exisningRow.V,
                            W: exisningRow.W,
                            X: exisningRow.X,
                            Y: exisningRow.L,
                            Z: exisningRow.Z,
                        };
                    }
                }
                // если это полностью новая строка
                return {
                    ...newRow,
                    Y: newRow.L || '',
                };
            })
        );

        // Обновление ПОРЯДКА при добавлении новых данных

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
    };

    // Обработчик изменения порядка

    const handleOrderChange = (newOrder) => {
        setTableOrder(newOrder);
    };

    return (
        <div>

            <DisplayData
                data={tableData}
                order={tableOrder}
                onOrderChange={handleOrderChange}
                onCellChange={setTableData}
                fileHistory={fileHistory}
            />
            <UploadFiles onUpload={handleUpload} />
        </div>
    );
}
