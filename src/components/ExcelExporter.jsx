// СТРОКА 90 - именование столбцов
import React from 'react';
import * as XLSX from 'xlsx';

const ExcelExporter = ({
    data,
    fileName = 'export.xlsx',
    buttonLabel = 'Export to Excel',
    buttonClass = '',
}) => {
    // Явно задаем порядок и список всех колонок
    const COLUMNS = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V_first',
        'W_payer',
        'X_pallets',
        'Y',
        'Z_bid',
        'Z_crossedCellAddress',
        'Z_crossedCellClient',
        'Z_marker',
        'V_latitude', // Новая колонка
        'V_longitude', // Новая колонка
    ];

    // const parseAddress = (addressStr, isTk) => {
    //     if (!addressStr) return { address: '', lat: '', lon: '' };

    //     try {

    //             const parts = addressStr.split(';');

    //             const coordsPart = parts[parts.length - 1].trim();

    //             const [lat, lon] = coordsPart
    //                 .split(',')
    //                 .map((s) => s.trim().replace(',', '.'));

    //             return {
    //                 address: parts.slice(0, -2).join(';').trim(),
    //                 lat: lat || '',
    //                 lon: lon || '',
    //             };
    //         } catch (e) {
    //             return { address: addressStr, lat: '', lon: '' };
    //         }
    // };

    // Функция парсинга адреса

    const parseAddress = (addressStr, isTk) => {
        const defaultResult = { address: addressStr || '', lat: '', lon: '' };

        try {
            if (!addressStr) return defaultResult;

            // Для ТК используем полный адрес без разбивки

            // const parts = isTk ? [addressStr] : addressStr.split('; ');
            const parts = addressStr.split(';');

            // Извлекаем координаты из последней части

            const coordsPart = parts[parts.length - 1].trim();

            const [rawLat, rawLon] = coordsPart
                .split(',')
                .map((s) => s.trim().replace(/,/g, '.'));

            const lat = parseFloat(rawLat) || '';
            const lon = parseFloat(rawLon) || '';

            // Формируем адрес без координатов для TK

            const address = isTk
                ? parts.slice(0, -1).join(';').trim()
                : parts.slice(0, -2).join(';').trim();

            return { address, lat, lon };
        } catch (error) {
            console.error('Address parsing error:', error);

            return defaultResult;
        }
    };

    const getSafeValue = (value) => {
        if (value === null || value === undefined) return ' ';
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
    };

    const processData = (items) => {
        return items.map((item) => {
            if (item.F === 'Zabiraem') { 
                item.F = 'Забираем';
            }
            if (item.F === 'Otvozim') {
                item.F = 'Отвозим';
            }    
        
            //     item.F = 'Zabiraem' ? 'Забираем' : item.F;
            // item.F = 'Otvozim' ? 'Отвозим' : item.F;
            const isTk = item.F?.toLowerCase()?.startsWith('тк');
            const vData = parseAddress(
                item.V?.[0],
                isTk
            );

            return COLUMNS.map((column) => {
                switch (column) {
                    // case 'G':
                    //     return item.G ? item.G : 0;

                    case 'V_first':
                        // return getSafeValue(item.V?.[0]);
                        return getSafeValue(vData.address);

                    case 'V_latitude':
                        return getSafeValue(vData.lat);

                    case 'V_longitude':
                        return getSafeValue(vData.lon);

                    case 'W_payer':
                        return getSafeValue(item.W?.value);

                    case 'X_pallets':
                        return getSafeValue(item.X?.value);

                    case 'Z_bid': //делаем false нулем "0", а true ИСТИНОЙ - "ИСТИНА"
                        return getSafeValue(
                            item.Z?.bid ? item.Z?.bid : +item.Z?.bid
                        );

                    case 'Z_crossedCellAddress':
                        return getSafeValue(
                            item.Z?.crossedCellAddress
                                ? item.Z?.crossedCellAddress
                                : +item.Z?.crossedCellAddress
                        );

                    case 'Z_crossedCellClient':
                        return getSafeValue(
                            item.Z?.crossedCellClient
                                ? item.Z?.crossedCellClient
                                : +item.Z?.crossedCellClient
                        );

                    case 'Z_marker':
                        return getSafeValue(
                            item.Z?.marker ? item.Z?.marker : +item.Z?.marker
                        );

                    default:
                        return getSafeValue(item[column]);
                }
            });
        });
    };

    const handleExport = () => {
        try {
            if (!data?.length) throw new Error('Нет данных для экспорта');

            // Подготовка данных
            const headerRow = COLUMNS;
            // const headerRow = COLUMNS.map(col => COLUMNS_NAMES[col] || col)
            const dataRows = processData(data);

            // Создание книги Excel
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

            // Настройка ширины столбцов
            worksheet['!cols'] = COLUMNS.map(() => ({ wch: 5 }));
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные');

            // Генерация и сохранение файла
            const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array',
            });

            const blob = new Blob([excelBuffer], {
                type: 'application/octet-stream',
            });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();

            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Ошибка экспорта:', error);

            alert(error.message);
        }
    };

    return (
        <button
            onClick={handleExport}
            className={`export-button ${buttonClass}`}
            disabled={!data?.length}
        >
            {buttonLabel}
        </button>
    );
};

export default ExcelExporter;
