import { useState, useEffect } from 'react';
import localForage from 'localforage';
import UploadFiles from './components/UploadFiles';
import DisplayData from './components/DisplayData';
import './App.css';

// const getLocalData = async () => {
//     try {
//         const value1 = await localForage.getItem('tableData');
//         const value2 = await localForage.getItem('fileVersionData');
//         console.log('tableData');
//         console.log(value1);
//         console.log('fileVersionData');
//         console.log(value2);
//         // return value;
//         // await localforage.setItem('items', data);
//         // console.log('Данные сохранены');
//     } catch (err) {
//         console.error('Ошибка считывания localForage:', err);
//     }
// };

export default function App() {
    const [tableData, setTableData] = useState([]);
    const [fileHistory, setFileHistory] = useState({current: [], previous: []}); //для сверки новых данных из xls со старыми

    // Загрузка данных из хранилища при монтировании
    useEffect(() => {
        const loadData = async () => {
            const [savedData, savedHitory] = await Promise.all([
                localForage.getItem('tableData'),
                localForage.getItem('fileHistory')
            ]);
                // if (savedData) setTableData(savedData);
                // if (savedFileData) setFileVersionData(savedFileData);
                setTableData(savedData || []);
                setFileHistory(savedHitory || {current: [], previous: []});
        };
        loadData();
    }, []);

    // Сохранение данных в localForage при изменении
    useEffect(() => {
        localForage.setItem('tableData', tableData);
        localForage.setItem('fileHistory', fileHistory);
    }, [tableData, fileHistory]);
    // }, [tableData]);


    // Обработка новых данных из файла
    const handleUpload = (newData) => {
       // сохраняем предыдущую версию данных перед обновлением
      const previousData = fileHistory.current;

      // обновляем историю файлов  
      setFileHistory(prev => ({
        current: newData,
        previous: prev.current // сохраняем предыдущую версию
      }));
        
        // находим удаленные строки
        const removedRows = previousData.filter(prevRow => 
          !newData.some(newRow => newRow.B === prevRow.B)
        )

        // alert для удаленных строк
        if (removedRows.length > 0) {
            const removedInvoices = removedRows.map(row => row.B).join(', ');
            alert(`Удалены счета : ${removedInvoices}`);
            console.log(`Удалены счета : ${removedInvoices}`);
        }

    //   setTableData1((prev) => {
    //     // console.log(prev[0].F);
    //     // console.log(newData[0].F);
    //         // Объединяем новые данные с существующими, сохраняя изменения столбца F
    //       const merged = newData.map((row, index) => (
    //         {
    //             ...row,
    //             F: prev[index]?.F || row.F,
    //             V: prev[index]?.V || row.V,
    //         }));
    //         return merged;
    //   });
        
        // изменение предыдущего состояния таблицы при handleUpload
        setTableData((prev) =>
            // допишем к пред. состоянию только новые счета
            // также надо учесть, что при наличии новых счетов, надо скоприовать единожды комментарий L в Y
            newData.map(newRow => {
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
                // return exisningRow
                //     ? {
                //           ...newRow,
                //           F: exisningRow.F,
                //           V: exisningRow.V,
                //           //   Y: exisningRow.L,
                //       }
                //     : newRow;
            })
        );  

    };

    return (
        <div>
            <UploadFiles onUpload={handleUpload} />
            {/* <button onClick={() => getLocalData()}>GetLocal</button> */}
            <DisplayData data={tableData} onCellChange={setTableData} fileHistory={fileHistory}/>
        </div>
    );
}