// import "./DisplayData.css";
import { useState } from 'react';
import StatsPanel from './StatsPanel';
import { COLUMN_HIDDEN, COLUMN_ORDER } from '../utils/constants';



export default function DisplayData({ data, onCellChange, fileHistory }) {
    const [hiddenColumns, setHiddenColumns] = useState(COLUMN_HIDDEN);
    const [mask, setMask] = useState(COLUMN_ORDER);

    // // фильтрация и упорядочивание столбцов
    // const headers = customColumnOrder
    //     .filter(header =>
    //         data[0]?.hasOwnProperty(header) &&
    //             !hiddenColumns.includes(header)
    //     );

    //фунцкия переключения видимости колонок
    const toggleColumns = () => {
        !mask.length ? setMask(COLUMN_ORDER) : setMask([]);
        setHiddenColumns(
            (prev) => (prev.length === 0 ? COLUMN_HIDDEN : [])
            // ["A", "B", "E", "G", "J", "K", "Q", "F", "V", "L", "M"]
        );
    };

    // Функция для сравнения значений с учётом разных типов данных
    const compareValues = (a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }
        return String(a).localeCompare(String(b));
    };

    // Сортировка данных
    const sortedData = [...data].sort((a, b) => {
        // 1. Сортировка по столбцу F (возрастание)
        const compareF = compareValues(a.F, b.F);
        if (compareF !== 0) return compareF;
        // 2. Сортировка по столбцу S (возрастание)
        return compareValues(a.S, b.S);
        // const compareS = compareValues(a.S, b.S);
        // if (compareS !== 0) return compareS;
        // 3. Сортировка по столбцу E (убывание)
        // return compareValues(b.E, a.E);
    });

    // Определение изменений между версиями файлов
    const getChangedCells = () => {
        const changed = new Set();

        //создаем карту предыдущих данных по номеру счета из столбца B
        const prevMap = new Map();
        fileHistory.previous.forEach((row) => {
            prevMap.set(row.B, row);
        });

        fileHistory.current.forEach((currentRow) => {
            const prevRow = prevMap.get(currentRow.B);
            if (!prevRow) {
                // Новая строка - все ячейки изменены
                Object.keys(currentRow).forEach((header) => {
                    if (header !== 'B')
                        changed.add(`${currentRow.B}-${header}`);
                });
                return;
            }

            Object.keys(currentRow).forEach((header) => {
                if (
                    header !== 'B' &&
                    header !== 'V' &&
                    currentRow[header] !== prevRow[header]
                ) {
                    changed.add(`${currentRow.B}-${header}`);
                }
            });
        });

        return changed;
    };

    //     fileHistory.previous.forEach((prevRow, rowIndex) => {
    //         Object.keys(prevRow).forEach((header) => {
    //             if (
    //                 fileHistory.current[rowIndex]?.[header] !== prevRow[header]
    //             ) {
    //                 changed.add(`${rowIndex}-${header}`);
    //             }
    //         });
    //     });
    //     return changed;
    // };

    const changedCells = getChangedCells();

    // функция для проверки изменений относительно последнего обновлений
    // const isChangedFromFiled = (rowIndex, column) => {
    //   return fileVersionData[rowIndex]?.[column] !== data[rowIndex]?.[column];
    // }

    const getCellStyle = (header, rowIndex, value) => {
        const styles = { padding: '8px' };

        // Стилизация для столбца A исходя из зачения value в ключе A
        // if (header === "A") {
        //   const lowerValue = data[rowIndex]?.[header]?.toLowerCase();
        //   const lowerValue = value?.toLowerCase?.() || "";
        //   switch (lowerValue) {
        //     case "green":
        //       styles.backgroundColor = "#90EE90";
        //       break;
        //     case "red":
        //       styles.backgroundColor = "#FFB6C1";
        //       break;
        //     case "blue":
        //       styles.backgroundColor = "#87CEEB";
        //       break;
        //     default:
        //       break;
        //   }
        // }
        // Подсветка изменений из файла
        // if(isChangedFromFiled(rowIndex, header)) {
        if (changedCells.has(`${rowIndex.B}-${header}`)) {
            // return { ...style, backgroundColor: 'yellow' };
            styles.backgroundColor = 'yellow';
        }
        // if (fileVersionData[rowIndex]?.[header] !== data[rowIndex]?.[header]) {
        //   styles.backgroundColor = "yellow";
        // }

        return styles;
    };

    // const handleChange = (rowIndex, value) => {
    //     const newData = data.map((row, index) =>
    //         index === rowIndex ? { ...row, F: value } : row
    //     );

    //     onCellChange(newData);
    // };
    const handleChange = (rowIndex, column, value) => {
        const newData = data.map((row) =>
            row.B === rowIndex ? { ...row, [column]: value } : row
        );
        // console.log(value);
        // const newData = data.map((row, index) =>
        //   index === rowIndex ? { ...row, [column]: value } : row
        // );
        // возможно здесть надо определять массив в V, исходя из значения F и записывать все это в newData
        onCellChange(newData);
    };

    const handleChange_V = (rowIndex, column, e, arrForSortByFirstVal) => {
        // console.log(e.target.list.id);

        const selectedValue = e.target.value;
        if (!arrForSortByFirstVal.includes(selectedValue)) {
            arrForSortByFirstVal.push(selectedValue);
        }
        const resultArr = arrForSortByFirstVal.sort((a, b) => {
            if (a === selectedValue) return -1;
            if (b === selectedValue) return 1;
            return a.localeCompare(b);
        });

        // const idDatalist = e.target.list.id;

        const newData = data.map((row, index) => {
            return row['B'] === rowIndex
                ? { ...row, [column]: resultArr }
                : row;
        });

        onCellChange(newData);
    };

    if (!data.length) return null;

    const allHeaders = Object.keys(data[0]);
    const filterHeadersByMask = allHeaders.filter(
        (h) => !hiddenColumns.includes(h)
    );
    // const filterHeaders  = ['A', 'B', 'E', 'G', 'J', 'K', 'Q', 'F', 'V', 'L', 'M'];
    // const mask = ['A', 'B', 'E', 'G', 'J', 'K', 'Q', 'F', 'V', 'L', 'M'];
    // расоложим в уодбном порядке столцбы

    const filterHeaders = filterHeadersByMask.sort((a, b) => {
        const indexA = mask.indexOf(a[0]);
        const indexB = mask.indexOf(b[0]);
        return indexA - indexB;
    });

    // const headers = Object.keys(data[0]);
    // const headers = ["A", "B", "E", "G", "J", "K", "Q", "F", "V", "L", "M"];
    // const addresses = ['адрес_1','адрес_2']

    return (
        <div className="displayData">
            <button
                onClick={toggleColumns}
                style={{ margin: '10px 0', padding: '5px 15px' }}
            >
                {hiddenColumns.length
                    ? 'Показать все стоблцы'
                    : 'Скрыть неиспользуемые столбцы'}
            </button>
            <StatsPanel data={data} />
            {/* <datalist id="addressList">
                {addresses.map((address, index) => (
                    <option key={index} value={ address} />
                ))}
            </datalist> */}
            {/* <table style={{ with: '100%', borderCollapse: 'separate' }}> */}
            <table style={{ with: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {filterHeaders.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {/* {sortedData.map(row => ())} */}
                    {sortedData.map((row, rowIndex) => (
                        <tr
                            key={row.B}
                            style={{
                                // backgroundColor: row.V[0]  ? 'lightgray' : 'none',
                                borderTop: row.V[0]
                                    ? '7px solid darkgrey'
                                    : 'none',
                                // border: row.V[0] ? '2px solid blue' : 'none',
                                position: 'relative',
                            }}
                        >
                            {/* {alert(rowIndex)} */}
                            {filterHeaders.map((header) => (
                                <td
                                    key={header}
                                    style={{
                                        border: '1px solid #ddd',
                                        ...getCellStyle(header, row),
                                    }}
                                >
                                    {header === 'F' ? (
                                        <input
                                            defaultValue={row[header]}
                                            onBlur={(e) =>
                                                handleChange(
                                                    row.B,
                                                    header,
                                                    e.target.value
                                                )
                                            }
                                            style={{ width: '10em' }}
                                        />
                                    ) : header === 'V' ? (
                                        <>
                                            <input
                                                // list="addressList"
                                                list={row['B'] + '_V'}
                                                // value={row[header][0]}
                                                defaultValue={row[header][0]}
                                                onBlur={(e) =>
                                                    handleChange_V(
                                                        row.B,
                                                        header,
                                                        e,
                                                        row[header]
                                                    )
                                                }
                                            />
                                            <datalist id={row['B'] + '_V'}>
                                                {row[header].map(
                                                    (address, index) => (
                                                        <option
                                                            key={index}
                                                            value={address}
                                                        />
                                                    )
                                                )}
                                            </datalist>
                                        </>
                                    ) : (
                                        row[header]
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
