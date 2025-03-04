import { useState, useRef } from 'react';
import excelToJson from '../utils/excelToJson';
import { decode } from 'windows-1251';

import {
    customRound,
    detectCompany,
    fullingDate,
} from '../utils/helpersFunctions';

import { TABLE_HEAD } from '../utils/constants';
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
                } else {
                    processed[elemInArr] = '';
                }

                // element['V'] = [];
                processed['V'] = [];
            });

            return processed;
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
            if (files.length !== 2)
                throw new Error('Please select exactly 2 files');

            const processingPromises = Array.from(files).map((file, index) =>
                readExcelFile(file, index)
            );

            const results = await Promise.all(processingPromises);

            const mergedData = results.flat(); // или results.concat()

            onUpload(mergedData);
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
            <label>Upload your Excel files:</label>

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
                            accept=".xlsx, .xls, .csv"
                            multiple
                            disabled={isLoading}
                        />

                        <div className="drop-message">
                            {isLoading
                                ? 'Processing...'
                                : 'Drag & drop files here or click to select'}
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
