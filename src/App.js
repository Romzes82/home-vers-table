import { useState, useEffect } from 'react';
import localForage from 'localforage';
import UploadFiles from './components/UploadFiles';
import DisplayData from './components/DisplayData';
import './App.css';

const getLocalData = async () => {
    try {
        const value = await localForage.getItem('tableData');
        console.log(value);
        // return value;
        // await localforage.setItem('items', data);
        // console.log('Данные сохранены');
    } catch (err) {
        console.error('Ошибка сохранения:', err);
    }
};

export default function App() {
    const [tableData, setTableData] = useState([]);

    // Загрузка данных из хранилища при монтировании
    useEffect(() => {
        const loadData = async () => {
            const savedData = await localForage.getItem('tableData');
            if (savedData) setTableData(savedData);
        };
        loadData();
    }, []);

    // Сохранение данных в localForage при изменении
    useEffect(() => {
        localForage.setItem('tableData', tableData);
    }, [tableData]);

    // Обработка новых данных из файла
    const handleUpload = (newData) => {
      setTableData((prev) => {
        // console.log(prev[0].F);
        // console.log(newData[0].F);
            // Объединяем новые данные с существующими, сохраняя изменения столбца B
          const merged = newData.map((row, index) => (
            {
                ...row,
                F: prev[index]?.F || row.F,
            }));
            return merged;
        });
    };

    return (
        <div>
            <UploadFiles onUpload={handleUpload} />
            <button onClick={() => getLocalData()}>GetLocal</button>
            <DisplayData data={tableData} onCellChange={setTableData} />
        </div>
    );
}

