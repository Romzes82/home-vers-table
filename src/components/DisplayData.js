import './DisplayData.css';
import { useState, useMemo, useEffect, useRef } from 'react';
import StatsPanel from './StatsPanel';
import { COLUMN_HIDDEN, COLUMN_ORDER } from '../utils/constants';
// import { EditableCell } from './EditableCell';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// import localForage from 'localforage';

// Компонент для сортируемой строки

const SortableRow = ({
    row,
    handleRowClick,
    filterHeaders,
    isCompact,
    getCellStyle,
    selectedIds,
    cellsRef,
    handleChange,
    handleChange_V,
    handleChange_W_or_X,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: row.B });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={{
                ...style,
                borderTop: row.V[0] ? '7px solid rgb(211 177 230)' : 'none',
                backgroundColor: selectedIds.has(row.B)
                    ? '#e0e0e0'
                    : 'rgb(248, 249, 250)',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                ...(isCompact && { height: '30px' }),
            }}
            // {...attributes}
            // {...listeners}
            onClick={(e) => handleRowClick(e, row)}
        >
            {filterHeaders.map((header, cellIndex) => {
                const isDraggableCell = header === 'A';
                return (
                    <td
                        key={header}
                        {...(isDraggableCell ? attributes : {})}
                        {...(isDraggableCell ? listeners : {})}
                        ref={(el) => (cellsRef.current[row.B + cellIndex] = el)}
                        // ref={(el) => (cellsRef.current[row.B + cellIndex] = el)}
                        style={{
                            cursor: isDraggableCell ? 'grab' : 'default',
                            border: '1px solid #ddd',
                            ...getCellStyle(header, row),
                            ...(isCompact && {
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '250px',
                            }),
                        }}
                    >
                        {renderCellContent(
                            header,
                            row,
                            handleChange,
                            handleChange_V,
                            handleChange_W_or_X
                        )}
                    </td>
                );
            })}
        </tr>
    );
};

// Вспомогательная функция для рендеринга содержимого ячейки

const renderCellContent = (
    header,
    row,
    handleChange,
    handleChange_V,
    handleChange_W_or_X
) => {
    switch (header) {
        case 'E':
            return (
                <div
                    style={{
                        textDecoration: row.Z?.crossedCellClient
                            ? 'line-through 2px #000'
                            : 'none',
                        // cursor: 'pointer',
                    }}
                    onClick={(e) => {
                        if (e.altKey) {
                            handleChange(row.B, 'Z', {
                                ...row.Z,
                                crossedCellClient: !row.Z?.crossedCellClient,
                            });
                        }
                    }}
                >
                    {row[header]}
                </div>
            );

        case 'Q':
            return (
                <div
                    style={{
                        textDecoration: row.Z?.crossedCellAddress
                            ? 'line-through 2px #000'
                            : 'none',
                        // cursor: 'pointer',
                    }}
                    onClick={(e) => {
                        if (e.altKey) {
                            handleChange(row.B, 'Z', {
                                ...row.Z,
                                crossedCellAddress: !row.Z?.crossedCellAddress,
                            });
                        }
                    }}
                >
                    {row[header]}
                </div>
            );

        case 'F':
            return (
                <input
                    defaultValue={row[header]}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                        }
                    }}
                    onBlur={(e) => handleChange(row.B, header, e.target.value)}
                    style={{ width: '10em' }}
                />
            );

        case 'V':
            return (
                <>
                    <input
                        list={`${row.B}_V`}
                        defaultValue={row[header][0]}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                            }
                        }}
                        onBlur={(e) =>
                            handleChange_V(row.B, header, e, row[header])
                        }
                    />

                    <datalist id={`${row.B}_V`}>
                        {row[header].map((address, index) => (
                            <option key={index} value={address} />
                        ))}
                    </datalist>
                </>
            );

        case 'Y':
            return (
                <textarea
                    defaultValue={row[header]}
                    className="full-cell-textarea"
                    // onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                        }
                    }}
                    // onBlur={(e) => handleChange(row.B, header, e.target.value)}
                    onBlur={(e) => {
                        e.target.scrollTop = 0;
                        handleChange(row.B, header, e.target.value);
                    }}
                />
            );

        case 'W':

        // eslint-disable-next-line no-fallthrough
        case 'X':
            return (
                <select
                    className={
                        row[header].value !== '' ? 'beige-with-value' : ''
                    }
                    defaultValue={row[header].value}
                    onBlur={(e) =>
                        // console.log(e.target.value)
                        handleChange_W_or_X(row.B, header, e)
                    }
                >
                    {row[header].options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        case 'Z':
            return (
                <>
                    <span> {(row[header]?.crossedCellClient).toString()} </span>
                    <span>{(row[header]?.crossedCellAddress).toString()}</span>
                </>
            );

        default:
            // <span data-value={row[header]?.value ?? row[header]}>
                return row[header]?.value ?? row[header];
           // </span> */}
    }
};

export default function DisplayData({
    data,
    order,
    onOrderChange,
    onCellChange,
    fileHistory,
}) {
    const [hiddenColumns, setHiddenColumns] = useState(COLUMN_HIDDEN);
    const [mask, setMask] = useState(COLUMN_ORDER);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showSumPanel, setShowSumPanel] = useState(true);
    const [isCompact, setIsCompact] = useState(true);
    const cellsRef = useRef([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Обработчик перетаскивания

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = order.indexOf(active.id);
        const newIndex = order.indexOf(over.id);
        const newOrder = arrayMove(order, oldIndex, newIndex);
        onOrderChange(newOrder);
    };

    // Сортированные данные согласно порядку

    const sortedData = useMemo(() => {
        const orderMap = new Map(order.map((id, index) => [id, index]));

        return [...data].sort((a, b) => orderMap.get(a.B) - orderMap.get(b.B));
    }, [data, order]);

    // Остальной код компонента остается без изменений

    // ... (все функции, стили и обработчики остаются как были)

    // Проверка обрезания текста и обновление title
    useEffect(() => {
     cellsRef.current.forEach((cell) => {
        console.log(cellsRef.current);
         if (cell) {
             if (cell && isCompact) {
                //  console.log(cell);
                 const isTruncated = cell.scrollWidth > cell.clientWidth;
                 cell.title = isTruncated ? cell.textContent : '';
             } else {
                 cell.title = '';
             }
         }
     });
    }, [isCompact, data]);

    // Стили для компактного режима
    // const compactStyles = {
    //     tr: {
    //         // height: '30px', // Фиксированная высота строки
    //     },
    //     td: {
    //         whiteSpace: 'nowrap',
    //         overflow: 'hidden',
    //         textOverflow: 'ellipsis',
    //         maxWidth: '250px', // Можно настроить под ваши нужды
    //     },
    // };

    // Обработчик клика по строке
    const handleRowClick = (e, row) => {
        if (e.ctrlKey || e.metaKey) {
            // setShowSumPanel(true);
            e.preventDefault();
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                newSet.has(row.B) ? newSet.delete(row.B) : newSet.add(row.B);
                return newSet;
            });
        }
    };

    // Вычисление сумм
    const { sumJ, sumK, sumX } = useMemo(() => {
        let j = 0,
            k = 0,
            x = 0;
        data.forEach((row) => {
            if (selectedIds.has(row.B)) {
                // console.log(Number(row.X.value));
                j += Number(row.J) || 0;
                k += Number(row.K) || 0;
                x += Number(row.X.value) || 0;
            }
        });
        return { sumJ: j.toFixed(2), sumK: k.toFixed(2), sumX: x };
    }, [data, selectedIds]);

    // Сброс выделения
    const resetSelection = () => {
        setSelectedIds(new Set());
        // setShowSumPanel(false);
    };

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

    // Сортировка данных ЗАМЕНИЛИ
    // const sortedData = [...data].sort((a, b) => {
    //     // 1. Сортировка по столбцу F (возрастание)
    //     const compareF = compareValues(a.F, b.F);
    //     if (compareF !== 0) return compareF;
    //     // 2. Сортировка по столбцу S (возрастание)
    //     return compareValues(a.S, b.S);
    //     // const compareS = compareValues(a.S, b.S);
    //     // if (compareS !== 0) return compareS;
    //     // 3. Сортировка по столбцу E (убывание)
    //     // return compareValues(b.E, a.E);
    // });

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
        const styles = { padding: '2px' };
        // const styles = {};
        if (header === 'Y') {
            styles.position = 'relative';
            styles.minWidth = '200px';
            return styles;
        }

        // стили для "плательщик"
        if (header === 'W' || header === 'X' || header === 'Z') {
            // console.log(rowIndex.X.value);
            // if (rowIndex[header].value !== '') {
            //     styles.backgroundColor = '#f4eddf';
            // }
            return styles;
        }

        if (changedCells.has(`${rowIndex.B}-${header}`)) {
            // return { ...style, backgroundColor: 'yellow' };
            styles.backgroundColor = 'yellow';
        }

        return styles;
    };

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

    const handleChange_W_or_X = (rowIndex, column, e) => {
        const newData = data.map((row) =>
            row.B === rowIndex
                ? {
                      ...row,
                      [column]: {
                          ...row[column], // сохраняем все существующие свойства
                          value: e.target.value, // обовляем только value
                          //   options: ['','Т','Д'],
                      },
                  }
                : row
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

    return (
        <div className="displayData">
            <div
                style={
                    {
                        position: 'sticky',
                        top: '0px',
                        width: '100%',
                        zIndex: '10',
                        backgroundColor: "white",
                    }
                }
            >
                <StatsPanel data={data} />
                <button
                    onClick={toggleColumns}
                    style={{ margin: '10px 0', padding: '5px 15px' }}
                >
                    {hiddenColumns.length
                        ? 'Показать все стоблцы'
                        : 'Скрыть неиспользуемые столбцы'}
                </button>
                <button
                    onClick={() => setIsCompact(!isCompact)}
                    style={{ margin: '10px 5px', padding: '5px 15px' }}
                >
                    {isCompact ? 'Обычный вид' : 'Компактный вид'}
                </button>
                {showSumPanel && (
                    <div
                        style={{
                            padding: '10px',
                            margin: '10px 0',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px',
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            // position: 'fixed'
                        }}
                    >
                        <div>
                            <strong>Выделено строк: </strong>
                            <span
                                style={{
                                    padding: '2px',
                                }}
                            >
                                {selectedIds.size}
                            </span>
                        </div>
                        <div>
                            <strong>Вес: </strong>{' '}
                            <span
                                style={{
                                    backgroundColor: 'rgb(224, 224, 224)',
                                    borderRadius: '6px',
                                    padding: '2px',
                                }}
                            >
                                &nbsp; {sumJ} &nbsp;
                            </span>
                        </div>
                        <div>
                            <strong>Объем: </strong>
                            <span
                                style={{
                                    backgroundColor: 'rgb(224, 224, 224)',
                                    borderRadius: '6px',
                                    padding: '2px',
                                }}
                            >
                                &nbsp; {sumK} &nbsp;
                            </span>
                        </div>
                        <div>
                            <strong>Паллет: </strong>
                            <span
                                style={{
                                    backgroundColor: 'rgb(224, 224, 224)',
                                    borderRadius: '6px',
                                    padding: '2px',
                                }}
                            >
                                &nbsp; {sumX} &nbsp;
                            </span>
                        </div>

                        <button
                            onClick={resetSelection}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#ff9900',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                            }}
                        >
                            Сбросить
                        </button>
                    </div>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <table
                    style={{
                        with: '100%',
                        borderCollapse: 'collapse',
                        marginBottom: '20px',
                    }}
                >
                    <thead>
                        <tr>
                            {filterHeaders.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        <SortableContext
                            items={sortedData.map((row) => row.B)}
                            strategy={verticalListSortingStrategy}
                        >
                            {/* {sortedData.map(row => ())} */}
                            {sortedData.map((row, rowIndex) => (
                                <SortableRow
                                    key={row.B}
                                    row={row}
                                    handleRowClick={handleRowClick}
                                    filterHeaders={filterHeaders}
                                    isCompact={isCompact}
                                    getCellStyle={getCellStyle}
                                    selectedIds={selectedIds}
                                    cellsRef={cellsRef}
                                    handleChange={handleChange}
                                    handleChange_V={handleChange_V}
                                    handleChange_W_or_X={handleChange_W_or_X}
                                />
                            ))}
                        </SortableContext>
                    </tbody>
                </table>
            </DndContext>
        </div>
    );
}

// <tr
//     key={row.B}
//     onClick={(e) => handleRowClick(e, row)}
//     // style={isCompact ? compactStyles.tr : {}}
//     style={{
//         // backgroundColor: row.V[0]  ? 'lightgray' : 'none',
//         borderTop: row.V[0]
//             ? '7px solid rgb(211 177 230)'
//             : 'none',
//         // border: row.V[0] ? '2px solid blue' : 'none',
//         position: 'relative',
//         // cursor: 'pointer',

//         backgroundColor: selectedIds.has(row.B)
//             ? '#e0e0e0'
//             : 'rgb(248, 249, 250)',

//         transition: 'background-color 0.2s',
//         ...(isCompact ? compactStyles.td : {}),
//     }}
// >
//     {/* {alert(rowIndex)} */}
//     {filterHeaders.map((header, cellIndex) => (
//         <td
//             key={header}
//             ref={(el) =>
//                 (cellsRef.current[
//                     rowIndex * 100 + cellIndex
//                 ] = el)
//             }
//             style={{
//                 border: '1px solid #ddd',
//                 ...getCellStyle(header, row),
//                 ...(isCompact
//                     ? compactStyles.td
//                     : {}),
//                 // position: 'relative',
//                 // minWidth: '200px'
//                 // width: '400em',
//                 // ...(isCompact && {
//                 //     whiteSpace: 'nowrap',
//                 //     overflow: 'hidden',
//                 //     textOverflow: 'ellipsis',
//                 //     maxWidth: '200px',
//                 // }),
//             }}
//         >
//             {header === 'F' ? (
//                 <input
//                     defaultValue={row[header]}
//                     onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                             e.preventDefault();
//                             // e.target.scrollTop = 0;
//                             e.target.blur();
//                         }
//                     }}
//                     onBlur={(e) =>
//                         handleChange(
//                             row.B,
//                             header,
//                             e.target.value
//                         )
//                     }
//                     style={{ width: '10em' }}
//                 />
//             ) : header === 'V' ? (
//                 <>
//                     <input
//                         // list="addressList"
//                         list={row['B'] + '_V'}
//                         // value={row[header][0]}
//                         defaultValue={
//                             row[header][0]
//                         }
//                         onKeyDown={(e) => {
//                             if (
//                                 e.key ===
//                                 'Enter'
//                             ) {
//                                 e.preventDefault();
//                                 // e.target.scrollTop = 0;
//                                 e.target.blur();
//                             }
//                         }}
//                         onBlur={(e) =>
//                             handleChange_V(
//                                 row.B,
//                                 header,
//                                 e,
//                                 row[header]
//                             )
//                         }
//                     />
//                     <datalist
//                         id={row['B'] + '_V'}
//                     >
//                         {row[header].map(
//                             (
//                                 address,
//                                 index
//                             ) => (
//                                 <option
//                                     key={index}
//                                     value={
//                                         address
//                                     }
//                                 />
//                             )
//                         )}
//                     </datalist>
//                 </>
//             ) : header === 'Y' ? (
//                 <textarea
//                     ref={textareaRef}
//                     type="text"
//                     defaultValue={row[header]}
//                     className="full-cell-textarea"
//                     onKeyDown={(e) => {
//                         if (e.key === 'Enter') {
//                             e.preventDefault();
//                             // e.target.scrollTop = 0;
//                             e.target.blur();
//                         }
//                     }}
//                     onBlur={(e) => {
//                         e.target.scrollTop = 0;
//                         handleChange(
//                             row.B,
//                             header,
//                             e.target.value
//                         );
//                     }}
//                 />
//             ) : header === 'W' ? (
//                 <select
//                     // value={row[header]?.value}
//                     className={
//                         row[header].value !== ''
//                             ? 'beige-with-value'
//                             : ''
//                     }
//                     defaultValue={
//                         row[header].value
//                     }
//                     onBlur={(e) => {
//                         // console.log(e.target.value);
//                         handleChange_W_or_X(
//                             row.B,
//                             header,
//                             e
//                         );
//                     }}
//                     // style={{ width: '10em' }}
//                     // list="addressList"
//                     // list={row['B'] + '_V'}
//                     // value={row[header][0]}
//                     // defaultValue={row[header][0]}
//                     // onBlur={(e) =>
//                     //     handleChange_V(
//                     //         row.B,
//                     //         header,
//                     //         e,
//                     //         row[header]
//                     //     )
//                     // }
//                 >
//                     {row[header].options.map(
//                         (option) => (
//                             <option
//                                 key={option}
//                                 value={option}
//                             >
//                                 {option}
//                             </option>
//                         )
//                     )}
//                 </select>
//             ) : header === 'X' ? (
//                 <select
//                     className={
//                         row[header].value !== ''
//                             ? 'beige-with-value'
//                             : ''
//                     }
//                     defaultValue={
//                         row[header].value
//                     }
//                     onBlur={(e) =>
//                         // console.log(e.target.value)
//                         handleChange_W_or_X(
//                             row.B,
//                             header,
//                             e
//                         )
//                     }
//                     // list="addressList"
//                     // list={row['B'] + '_V'}
//                     // value={row[header][0]}
//                     // defaultValue={row[header][0]}
//                     // onBlur={(e) =>
//                     //     handleChange_V(
//                     //         row.B,
//                     //         header,
//                     //         e,
//                     //         row[header]
//                     //     )
//                     // }
//                 >
//                     {row[header].options.map(
//                         (option) => (
//                             <option
//                                 key={option}
//                                 value={option}
//                             >
//                                 {option}
//                             </option>
//                         )
//                     )}
//                 </select>
//             ) : (
//                 row[header]
//             )}
//         </td>
//     ))}
// </tr>;
