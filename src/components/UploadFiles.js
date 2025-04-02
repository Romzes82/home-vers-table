import { useState, useRef } from 'react';
import excelToJson from '../utils/excelToJson';
import { decode } from 'windows-1251';

import {
    customRound,
    detectCompany,
    fullingDate,
} from '../utils/helpersFunctions';

import { QUANTITY_PALLET, TABLE_HEAD } from '../utils/constants';
import './UploadFiles.css';

const UploadFiles = ({ onUpload }) => {
    // alert("AAA");
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState('');

    const filesQueue = useRef([]);

    const arrKeys = Object.keys(TABLE_HEAD);

    const encodedDataWin1251 = (row) => {
        return decode(row, { mode: 'replacement' });
    };

    const processExcelData = (data, decoding) => {
        return data.map((element) => {
            // обработанный элемент-объект
            const processed = { ...element };

            for (const key in processed) {
                if (key === 'A')
                    // "1" -> 1
                    processed[key] = Number(processed[key]);

                if (typeof processed[key] !== 'number') {
                    if (decoding)
                        processed[key] = encodedDataWin1251(processed[key]);
                } else {
                    if (key === 'D')
                        processed[key] = fullingDate(processed[key]);

                    if (key === 'J')
                        // вес
                        processed[key] = customRound(processed[key], 0);

                    if (key === 'K')
                        // объем
                        processed[key] = customRound(processed[key], 1);
                }
            }

            arrKeys.forEach((elemInArr) => {
                // processed[elemInArr] = processed[elemInArr] || '';
                if (elemInArr in element) {
                    // do something
                    if (
                        processed['F'] === 'Доставка по межгороду за наш счет'
                    ) {
                        processed['F'] = 'd_Доставка по межгороду за наш счет';
                    }
                } else {
                    processed[elemInArr] = '';
                }

                // дополнительные столбцы;
                processed['V'] = [];
                processed['W'] = {
                    value: '', //текущее значение
                    options: ['', 'Т', 'Д'],
                };
                processed['X'] = {
                    value: '', //текущее значение
                    options: QUANTITY_PALLET,
                };
                processed['Y'] = '';
                processed['Z'] = {
                    crossedCellClient: false,
                    crossedCellAddress: false,
                    bid: false,
                    marker: false,
                    borderTop: false,
                };
            });

            return processed;
        });
    };

    // Чтение текстового файла

    const readTextFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // 1. Получаем данные как ArrayBuffer
                    const buffer = e.target.result;
                    // 2. Определяем кодировку
                    const decoder = new TextDecoder('windows-1251');
                    // 3. Декодируем содержимое
                    const text = decoder.decode(new Uint8Array(buffer));
                    // const text = e.target.result;
                    // console.log(text);
                    const lines = text
                        .split('\n')
                        .filter((line) => line.trim() !== '')
                        .map((line, index) => ({
                            A: index + 1,
                            B: (index + 1).toString(),
                            C: '',
                            D: '',
                            E: '',
                            F: 'Zabiraem',
                            G: 0,
                            H: 0,
                            I: 0,
                            J: 0,
                            K: 0,
                            L: line.trim(),
                            M: '',
                            N: '',
                            O: '',
                            P: '',
                            Q: '',
                            R: '',
                            S: 999111999,
                            T: '',
                            U: '',
                            V: [],
                            // W: '',
                            // X: 0,
                            Y: '',
                            W: {
                                value: '', //текущее значение
                                options: ['', 'Т', 'Д'],
                            },
                            X: {
                                value: '', //текущее значение
                                options: QUANTITY_PALLET,
                            },
                            Z: {
                                crossedCellClient: false,
                                crossedCellAddress: false,
                                bid: false,
                                marker: false,
                                borderTop: false,
                            },
                            // Y: '',
                        }));
                    resolve(lines);
                } catch (error) {
                    console.log(
                        'Ошибка декодирования текстового файла:',
                        error
                    );
                    resolve([]);
                }
            };
            reader.onerror = () => resolve([]);
            reader.readAsArrayBuffer(file); // читаем не как файл, а как бинарные данные
        });
    };

    const readExcelFile = (file, index) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            try {
                const { decoding, sheetName, startRow } = detectCompany(
                    file.name
                );

                reader.onload = (event) => {
                    const data = new Uint8Array(event.target.result);
                    const result = excelToJson({ source: data });
                    const sheetData = result[sheetName].slice(startRow);
                    const processedData = processExcelData(sheetData, decoding);

                    resolve(processedData);
                };

                reader.onerror = (error) => reject(error);

                reader.readAsArrayBuffer(file);
            } catch (err) {
                reject(err);
            }
        });
    };

    const handleFilesProcessing = async (files) => {
        setIsLoading(true);

        setError('');

        try {
            if (files.length !== 3) {
                alert('Некорректный набор файлов: нужно 2 Excel и 1 TXT');
                // throw new Error('Please select exactly 3 files');
                return;
            }

            // Разделение файлов по типам
            const excelFiles = [];
            let textFile = null;

            Array.from(files).forEach((file) => {
                if (file.name.match(/\.(xlsx|xls)$/i)) {
                    excelFiles.push(file);
                } else if (file.name.match(/\.txt$/i)) {
                    textFile = file;
                }
            });

            // Проверка соотношения файлов
            if (excelFiles.length !== 2 || !textFile) {
                alert('Некорректный набор файлов: нужно 2 Excel и 1 TXT');
                return;
            }

            const processingPromises = Array.from(excelFiles).map(
                (file, index) => readExcelFile(file, index)
            );
            // console.log(processingPromises);

            const results = await Promise.all(processingPromises);
            // console.log(results);

            const textData = await readTextFile(textFile);
            const arrTextData = [textData];
            // console.log(arrTextData);
            const mergedData = [...results, ...arrTextData];
            // console.log(mergedData);
            const mergedTxtXlsData = mergedData.flat(); // или results.concat()

            onUpload(mergedTxtXlsData);
        } catch (err) {
            setError(err.message);

            onUpload([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileInput = async (event) => {
        const files = event.target.files;
        filesQueue.current = files;
        await handleFilesProcessing(files);
        event.target.value = '';
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        filesQueue.current = files;
        await handleFilesProcessing(files);
    };

    return (
        <div className="uploadFile">
            {/* <label>Обновить три файла:</label> */}

            <div>
                <label
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    htmlFor="file"
                >
                    <div className="drop-zone">
                        <input
                            onChange={handleFileInput}
                            id="file"
                            type="file"
                            accept=".xlsx, .xls, .txt"
                            multiple
                            disabled={isLoading}
                        />

                        <div className="drop-message">
                            {isLoading
                                ? 'Processing...'
                                // : 'Загрузить/Обновить файлы'}
                                :
                                <>
                                    Upload
                                    <div style={{padding: '20px 0 5px 0'}}>
                                      <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000" stroke="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="none" stroke="#666" strokeWidth="2" d="M1.7507,16.0022 C3.3517,20.0982 7.3367,23.0002 11.9997,23.0002 C18.0747,23.0002 22.9997,18.0752 22.9997,12.0002 M22.2497,7.9982 C20.6487,3.9012 16.6627,1.0002 11.9997,1.0002 C5.9247,1.0002 0.9997,5.9252 0.9997,12.0002 M8.9997,16.0002 L0.9997,16.0002 L0.9997,24.0002 M22.9997,0.0002 L22.9997,8.0002 L14.9997,8.0002"></path> </g></svg>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                </label>
            </div>

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default UploadFiles;

// =======================

// import * as XLSX from 'xlsx';

// export default function Upload({ onUpload }) {
//     const handleFile = async (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             const data = new Uint8Array(e.target.result);
//             const workbook = XLSX.read(data, { type: 'array' });
//             const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//             const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
//             // Преобразуем в массив объектов {A: val1, B: val2, ...}
//             const headers = jsonData[0];
//             const rows = jsonData.slice(1).map((row) =>
//                 headers.reduce((obj, header, index) => {
//                     obj[header] = row[index] || '';
//                     return obj;
//                 }, {})
//             );
//             onUpload(rows);
//         };

//         reader.readAsArrayBuffer(file);
//     };

//     return (
//         <div>
//             <input type="file" accept=".xlsx, .xls" onChange={handleFile} />
//         </div>
//     );
// }
