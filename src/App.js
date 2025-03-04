import { useState, useEffect } from 'react';
import localForage from 'localforage';
import UploadFiles from './components/UploadFiles';
import DisplayData from './components/DisplayData';
import './App.css';

const getLocalData = async () => {
    try {
        const value1 = await localForage.getItem('tableData');
        const value2 = await localForage.getItem('fileVersionData');
        console.log('tableData');
        console.log(value1);
        console.log('fileVersionData');
        console.log(value2);
        // return value;
        // await localforage.setItem('items', data);
        // console.log('Данные сохранены');
    } catch (err) {
        console.error('Ошибка считывания localForage:', err);
    }
};

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
        
        setTableData((prev) => 
            newData.map(newRow => { 
                const exisningRow = prev.find(r => r.B === newRow.B);
                return exisningRow
                    ? {
                          ...newRow,
                          F: exisningRow.F,
                          V: exisningRow.V,
                      }
                    : newRow;
            })
        );  

    };

    return (
        <div>
            <UploadFiles onUpload={handleUpload} />
            <button onClick={() => getLocalData()}>GetLocal</button>
            <DisplayData data={tableData} onCellChange={setTableData} fileHistory={fileHistory}/>
        </div>
    );
}

