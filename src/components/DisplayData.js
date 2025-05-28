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
import { customRound, getGroupStatus } from '../utils/helpersFunctions';
import ExcelExporter from './ExcelExporter';
import SendDeliveryButton from './SendDeliveryButton';
// import localForage from 'localforage';

// //// Функция преобразования данных
const transformDataToTruckMapFormat = (forMapData) => {
    const groupedData = {};

    // Сначала определяем клиентов (по ИНН), у которых есть хотя бы одна паллета

    const clientsWithPallets = new Set();

    forMapData.forEach((item) => {
        const xValue = Number(item.X?.value) || 0;

        if (xValue > 0) {
            clientsWithPallets.add(item.S); // Добавляем ИНН клиента
        }
    });

    // Группируем данные по ID (поле A)

    forMapData.forEach((item) => {
        const id = item.A;

        if (!groupedData[id]) {
            groupedData[id] = {
                items: [],
                sumJ: 0,
                sumK: 0,
                sumX: 0,
                sumVolumeInPallet: 0,
                inn: item.S, // Сохраняем ИНН для группы
            };
        }

        groupedData[id].items.push(item);
        groupedData[id].sumJ += Number(item.J) || 0;
        groupedData[id].sumK += Number(item.K) || 0;

        const xValue = Number(item.X?.value) || 0;
        groupedData[id].sumX += xValue;

        // Если у клиента есть хотя бы одна паллета в любом из заказов - суммируем весь объем
        if (clientsWithPallets.has(item.S)) {
            groupedData[id].sumVolumeInPallet += Number(item.K) || 0;
        }
    });

    // Преобразуем в конечный формат
    return Object.values(groupedData).map((group) => {
        const firstItem = group.items[0];
        const addressItem = firstItem.V?.[0] || '';

        // Извлекаем координаты (последние 2 значения после ;)
        let latitude = '';
        let longitude = '';
        if (addressItem.includes(';')) {
            const parts = addressItem.split(';');
            const coords = parts[parts.length - 1].trim().split(',');
            if (coords.length === 2) {
                latitude = coords[0].trim().replace(',', '.');
                longitude = coords[1].trim().replace(',', '.');
            }
        }

        return {
            id: String(firstItem.A),
            address: addressItem.split(';')[0]?.trim() || '',
            client: firstItem.F === 'Москва и область' ? firstItem.E : '',
            info:
                firstItem.F === 'Москва и область'
                    ? firstItem.Y
                    : firstItem.Y +
                          '<br/>' +
                          addressItem.split(';')[0]?.trim() +
                          ', ' +
                          addressItem.split(';')[1]?.trim() || '',
            latitude: latitude,
            longitude: longitude,
            pallet: String(group.sumX),
            type: firstItem.F || '',
            volume: String(customRound(group.sumK, 1)),
            volumeInPallet: String(customRound(group.sumVolumeInPallet, 1)),
            weight: String(group.sumJ),
            // inn: group.inn, // Добавляем ИНН в выходные данные
        };
    });
};

// const transformDataToTruckMapFormat = (forMapData) => {
//   const groupedData = {};
  
//   // Группируем данные по ID (поле A)
//   forMapData.forEach((item) => {
//       const id = item.A;
//       if (!groupedData[id]) {
//           groupedData[id] = {
//               items: [],
//               sumJ: 0,
//               sumK: 0,
//               sumX: 0,
//               sumVolumeInPallet: 0,
//           };
//       }

//       groupedData[id].items.push(item);
//       groupedData[id].sumJ += Number(item.J) || 0;
//       groupedData[id].sumK += Number(item.K) || 0;

//       const xValue = Number(item.X?.value) || 0;
//       groupedData[id].sumX += xValue;

//       if (xValue > 0) {
//           groupedData[id].sumVolumeInPallet += Number(item.K);
//       }
//   });

 
//   // Преобразуем в конечный формат
//   return Object.values(groupedData).map(group => {
//     const firstItem = group.items[0];
//     const addressItem = firstItem.V?.[0] || '';
    
//     // Извлекаем координаты (последние 2 значения после ;)
//     let latitude = '';
//     let longitude = '';
//     if (addressItem.includes(';')) {
//       const parts = addressItem.split(';');
//       const coords = parts[parts.length - 1].trim().split(',');
//       if (coords.length === 2) {
//         latitude = coords[0].trim().replace(',', '.');
//         longitude = coords[1].trim().replace(',', '.');
//       }
//     }
    
//     return {
//         id: String(firstItem.A),
//         address: addressItem.split(';')[0]?.trim() || '',
//         client: firstItem.F === 'Москва и область' ? firstItem.E : '',
//         info: firstItem.Y || '',
//         latitude: latitude,
//         longitude: longitude,
//         pallet: String(group.sumX),
//         type: firstItem.F || '',
//         volume: String(customRound(group.sumK,1)),
//         volumeInPallet: String(group.sumVolumeInPallet),
//         weight: String(group.sumJ),
//     };
//   });
// };

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
    tooltip,
    setTooltip,
    tkList,
    onContextMenu, // добавляем обработчик правого клика
    data,
    order
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: row.B });

    // Состояние для тултипа в V
    // const [tooltip, setTooltip] = useState({
    //     visible: false,
    //     text: '',
    //     x: 0,
    //     y: 0,
    // });

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
                borderTop: row.V[0] ? '6px solid rgb(211 177 230)' : 'none',
                backgroundColor: selectedIds.has(row.B)
                    ? '#e0e0e0'
                    : 'rgb(248, 249, 250)',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                ...isCompact,
            }}
            // {...attributes}
            // {...listeners}
            onClick={(e) => handleRowClick(e, row)}
            onContextMenu={(e) => onContextMenu(e, row)} // Обработчик правого клика
        >
            {filterHeaders.map((header, cellIndex) => {
                const isDraggableCell = header === 'A';
                return (
                    <td
                        key={header}
                        {...(isDraggableCell ? attributes : {})}
                        {...(isDraggableCell ? listeners : {})}
                        ref={(el) => {
                            // Используем безопасный ключ: row.B + header
                            const key = `${row.B}_${header}`;
                            cellsRef.current[key] = el;
                        }}
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

                                // гарантируем, что вложенные элементы наследуют стили
                                '& > *': {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                },
                            }),
                        }}
                    >
                        {renderCellContent(
                            header,
                            row,
                            handleChange,
                            handleChange_V,
                            handleChange_W_or_X,
                            tooltip,
                            setTooltip,
                            tkList,
                            data,
                            order
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
    handleChange_W_or_X,
    tooltip,
    setTooltip,
    tkList,
    data,
    order
) => {
    switch (header) {
        case 'E':
            return (
                <div
                    // className={
                    //     row.Z?.crossedCellClient !== false ? 'line-through' : ''
                    // }
                    style={{
                        textDecoration: row.Z?.crossedCellClient
                            ? 'line-through 2px #000'
                            : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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

        // case 'F':
        //     return (
        //         <input
        //             defaultValue={row[header]}
        //             onKeyDown={(e) => {
        //                 if (e.key === 'Enter') {
        //                     e.preventDefault();
        //                     e.target.blur();
        //                 }
        //             }}
        //             onBlur={(e) => handleChange(row.B, header, e.target.value)}
        //             style={{ width: '10em' }}
        //         />
        //     );
        case 'F':
            // const currentIndex = data.findIndex(r => r.B === row.B);
            const { isColored } = getGroupStatus(
                data,
                order,
                row,
                // currentIndex
            );
            // console.log(currentIndex, isGrouped, hasAddress);
            // console.log(data);
            // const suggestions = ['тк Транзит Авто', 'тк Антарэс', 'тк ПЭК'];
            return (
                <>
                    <input
                        style={{
                            border: isColored ? '4px solid red' : 'none',
                            // color: !isGrouped ? 'green' : 'none',

                            // backgroundColor: isColored ? '#aff2fd' : 'inherit',

                            fontStyle: row.Z?.bid ? 'italic' : 'none',
                            fontWeight: row.Z?.bid ? 'bold' : 'none',
                            color: row.Z?.marker ? 'red' : 'none',
                            width: '10em',
                        }}
                        // list={`${row.B}_F_suggestions`}
                        list="F_suggestions"
                        // defaultValue={row[header]}
                        // key={`${row.B}_${row.F}`}
                        key={`${row.B}_${row.Z?.bid}_${row.Z?.marker}`} // это для ререндера bid и marker в ячейке
                        value={row[header] || ''}
                        onChange={(e) => {
                            handleChange(row.B, header, e.target.value);
                        }}
                        // defaultValue={row[header]}

                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                            }
                        }}
                        onBlur={(e) =>
                            handleChange(row.B, header, e.target.value)
                        }
                        //  style={{ width: '10em' }}
                    />

                    {/* <datalist id={`${row.B}_F_suggestions`}>
                        {tkList.map((tk, index) => (
                            <option key={index} value={tk} />
                        ))}
                    </datalist> */}
                </>
            );
        // case 'F':
        //     return (
        //         <div className="input-with-icon-container">
        //             <input
        //                 list={`${row.B}_F_suggestions`}
        //                 defaultValue={row[header]}
        //                 onKeyDown={(e) => {
        //                     if (e.key === 'Enter') {
        //                         e.preventDefault();

        //                         e.target.blur();
        //                     }
        //                 }}
        //                 onBlur={(e) =>
        //                     handleChange(row.B, header, e.target.value)
        //                 }
        //                 style={{ width: '10em' }}
        //             />

        //             {row.Z?.bid && ( // Показываем иконку, если Z.bid = true
        //                 <span className="phone-icon">📞</span> // Иконка телефона
        //             )}

        //             <datalist id={`${row.B}_F_suggestions`}>
        //                 {tkList.map((tk, index) => (
        //                     <option key={index} value={tk} />
        //                 ))}
        //             </datalist>
        //         </div>
        //     );

        case 'V':
            return (
                <>
                    <div
                        style={{
                            position: 'relative',
                            display: 'inline-block',
                        }}
                        key={`${row.B}_${row.V}_${row.F}`}
                        onMouseEnter={(e) => {
                            const input =
                                e.currentTarget.querySelector('input');
                            const rect = input.getBoundingClientRect();

                            setTooltip({
                                visible: true,
                                text: input.value,
                                x: rect.left + window.scrollX,
                                // y: rect.top + window.scrollY - 35,
                                y: rect.top - 35,
                            });
                        }}
                        onMouseLeave={() =>
                            setTooltip({ ...tooltip, visible: false })
                        }
                    >
                        <input
                            list={`${row.B}_V`}
                            defaultValue={row[header][0]}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.target.blur();
                                }
                            }}
                            onBlur={(e) => {
                                handleChange_V(row.B, header, e, row[header]);
                                // console.log(tooltip.text, row[header][0]);
                            }}
                        />

                        {tooltip.visible &&
                            tooltip.text !== '' &&
                            tooltip.text === row[header][0] && (
                                <div
                                    className="custom-tooltip"
                                    style={{
                                        position: 'fixed',
                                        left: tooltip.x,
                                        top: tooltip.y,
                                        zIndex: 1000,
                                    }}
                                >
                                    {/*  Вставляем \n перед тел. и временем */}
                                    {
                                        tooltip.text
                                            .replace(/, тел\./g, ',\nтел.')
                                            .replace(/; /, ';\n')
                                            .replace(
                                                /(с \d{1,2}-\d{2} до \d{1,2}-\d{2}\.?)/g,
                                                '\n$1'
                                            )
                                            .replace(
                                                /\d{2,}\.\d+,\s*\d{2,}\.\d+/g,
                                                ''
                                            )
                                        // .replace(/(\d{8});/g, (match) => {
                                        //     // Разбиваем на части: день, месяц, год
                                        //     const day = match.slice(0, 2);
                                        //     const month = match.slice(2, 4);
                                        //     const year = match.slice(4, 8);
                                        //     return `${day}/${month}/${year};`; // Возвращаем новый формат
                                        // })
                                    }
                                </div>
                            )}
                    </div>
                    <datalist id={`${row.B}_V`}>
                        {row[header].map((address, index) => (
                            <option key={index} value={address} />
                        ))}
                    </datalist>
                </>
            );

        // case 'V':
        //     return (
        //         <>
        //             <input
        //                 list={`${row.B}_V`}
        //                 defaultValue={row[header][0]}
        //                 onKeyDown={(e) => {
        //                     if (e.key === 'Enter') {
        //                         e.preventDefault();
        //                         e.target.blur();
        //                     }
        //                 }}
        //                 onBlur={(e) =>
        //                     handleChange_V(row.B, header, e, row[header])
        //                 }
        //             />

        //             <datalist id={`${row.B}_V`}>
        //                 {row[header].map((address, index) => (
        //                     <option key={index} value={address} />
        //                 ))}
        //             </datalist>
        //         </>
        //     );

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
                    <span>
                        {' '}
                        {(row[header]?.crossedCellAddress).toString()}{' '}
                    </span>
                </>
            );

        default:
            return row[header]?.value ?? row[header];
        // <span className="text-cell-conten">
        //     {row[header]?.value ?? row[header]}
        // </span>;
    }
};

export default function DisplayData({
    data,
    order,
    onOrderChange,
    onCellChange,
    fileHistory,
    tkList,
    processMoscowItem,
    processTkItem,
    processTkItemByName
}) {
    const [hiddenColumns, setHiddenColumns] = useState(COLUMN_HIDDEN);
    const [mask, setMask] = useState(COLUMN_ORDER);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showSumPanel, setShowSumPanel] = useState(true);
    const [isCompact, setIsCompact] = useState(true);
    const cellsRef = useRef([]);
    // Реф для отслеживания выполнения начальной сортировки
    const initialSortDone = useRef(false);
    // Состояние для тултипа в V
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0,
    });

    // Состояние для контекстного меню

    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        row: null, // Строка, по которой был сделан правый клик
    });

    //Обработчик отправки данных в Map
    //  const sendDataToTruckMap = () => {
    //      if (!data || data.length === 0) return;
    //      const truckMapData = transformDataToTruckMapFormat(data);
    //      const targetWindow = window.open(
    //          //  'https://Romzes82.github.io/my-truck-map-pro',
    //          'http://localhost:3001',
    //          '_blank'
    //      );

    //      if (targetWindow) {
    //          const timer = setInterval(() => {
    //              targetWindow.postMessage(
    //                  {
    //                      type: 'UPDATE_TRUCK_MAP_DATA',
    //                      payload: truckMapData,
    //                  },
    //                  //  'https://Romzes82.github.io'
    //                  'http://localhost'
    //              );

    //              clearInterval(timer);
    //          }, 1000);
    //      }
    //  };

    // function sendDataToTruckMap() {
    //     // 1. Получаем данные из sortedData (уже подготовленные данные)

    //     if (!sortedData || sortedData.length === 0) {
    //         console.error('Нет данных для отправки');
    //         return;
    //     }

    //     // 2. Преобразуем данные в нужный формат
    //     const truckMapData = transformDataToTruckMapFormat(sortedData);
    //     console.log('Подготовленные данные для карты:', truckMapData);

    //     // 3. Открываем карту в новой вкладке (localhost:3001)
    //     const targetWindow = window.open('http://localhost:3001', '_blank');

    //     // 4. Отправляем данные после загрузки окна
    //     if (targetWindow) {
    //         let attempts = 0;
    //         const maxAttempts = 5;
    //         const intervalTime = 500; // Проверяем каждые 500мс
    //         const sendInterval = setInterval(() => {
    //             attempts++;
    //             try {
    //                 targetWindow.postMessage(
    //                     {
    //                         type: 'UPDATE_TRUCK_MAP_DATA',
    //                         payload: truckMapData,
    //                     },

    //                     'http://localhost:3001' // Origin получателя
    //                 );

    //                 console.log('Данные успешно отправлены на localhost:3001');

    //                 clearInterval(sendInterval);
    //             } catch (error) {
    //                 console.warn(`Попытка ${attempts}: Окно еще не готово`);

    //                 if (attempts >= maxAttempts) {
    //                     console.error(
    //                         'Не удалось отправить данные: превышено количество попыток'
    //                     );

    //                     clearInterval(sendInterval);
    //                 }
    //             }
    //         }, intervalTime);
    //     } else {
    //         console.error('Не удалось открыть окно с картой');
    //     }
    //     }

    // function sendDataToTruckMap() {
    //     if (!sortedData?.length) {
    //         console.error('Нет данных для отправки');

    //         return;
    //     }

    //     const truckMapData = transformDataToTruckMapFormat(sortedData);

    //     const targetUrl = 'http://localhost:3001';

    //     const targetWindow = window.open(targetUrl, '_blank');

    //     if (targetWindow) {
    //         const waitForLoad = () => {
    //             try {
    //                 targetWindow.postMessage(
    //                     {
    //                         type: 'UPDATE_TRUCK_MAP_DATA',

    //                         payload: truckMapData,
    //                     },

    //                     targetUrl
    //                 );

    //                 console.log('Данные отправлены');
    //             } catch (error) {
    //                 console.error('Ошибка отправки:', error);
    //             }
    //         };

    //         // Ждем полной загрузки окна

    //         targetWindow.addEventListener('load', waitForLoad);

    //         // На всякий случай таймаут

    //         setTimeout(() => {
    //             targetWindow.removeEventListener('load', waitForLoad);
    //         }, 5000);
    //     }
    // }

    //Проверка на наличие координат точки перед отправкой на карту
// async function ensureValidCoordinates(item) {
//     // Если координаты валидны - возвращаем как есть

//     if (
//         item.latitude &&
//         item.longitude &&
//         item.latitude !== '0' &&
//         item.longitude !== '0'
//     ) {
//         return item;
//     }

//     console.log(item.address);
//     try {
//         // Вызываемэндпоинт для геокодирования
//         const response = await fetch(
//             `http://localhost:8888/geo/get-coords-by-address?address=${encodeURIComponent(
//                 item.address
//             )}`
//         );

//         const data = await response.json();

//         if (response.status !== 200) {
//             throw new Error(data.error || 'Failed to geocode address');
//         }

//         // Обновляем sortedData, сохраняя исходный формат строки V
//         const index = sortedData.findIndex((i) => i.A === item.id);

//         if (index !== -1) {
//             // Разбираем существующую строку V

//             const vParts = sortedData[index].V[0].split(';');

//             // Сохраняем все части кроме координат (если они есть)
//             const addressPart = vParts[0] || item.address;
//             const datePart = vParts.length > 1 ? vParts[1] : '';
//             const otherParts = vParts.length > 2 ? vParts.slice(2) : [];

//             // Собираем обратно с новыми координатами

//             sortedData[index].V = [
//                 `${addressPart};${datePart};${data.latitude},${
//                     data.longitude
//                 };${otherParts.join(';')}`.replace(/;+$/, ''), // Удаляем лишние ; в конце
//             ];
//         }

//         // Возвращаем обновленный элемент

//         return {
//             ...item,
//             latitude: data.latitude,
//             longitude: data.longitude,
//             // address: data.fullAddress || item.address,
//             address: data.fullAddress || item.address,
//         };
//     } catch (error) {
//         console.error(`Ошибка геокодирования для пункта ${item.id}:`, error);

//         alert(
//             `Не удалось определить координаты для адреса: ${item.address}\n\n${error.message}`
//         );

//         throw error;
//     }
    //     }    
    
    // async function updateCoordinatesInData(data, setData) {
    // async function updateCoordinatesInData() {
    //     try {
    //         // Создаем копию данных для изменений

    //         const updatedData = [...data];

    //         let needsUpdate = false;

    //         // Проходим по всем элементам данных

    //         for (const item of updatedData) {
    //             // Проверяем каждый элемент массива V

    //             const updatedV = await Promise.all(
    //                 // eslint-disable-next-line no-loop-func
    //                 item.V.map(async (vItem, index) => {
    //                     // Разбиваем строку на части

    //                     const parts = vItem
    //                         .split(';')
    //                         .map((part) => part.trim());

    //                     // Проверяем координаты (последняя часть)

    //                     const coords = parts[parts.length - 1];

    //                     if (
    //                         coords !== '0,0' &&
    //                         coords.split(',').every((coord) => !isNaN(coord))
    //                     ) {
    //                         return vItem; // Координаты уже валидны
    //                     }

    //                     // Получаем адрес (первая часть)

    //                     const address = parts[0];

    //                     if (!address) return vItem;

    //                     try {
    //                         // Запрашиваем координаты

    //                         const response = await fetch(
    //                             `http://localhost:8888/geo/get-coords-by-address?address=${encodeURIComponent(
    //                                 address
    //                             )}`
    //                         );

    //                         if (!response.ok)
    //                             throw new Error('Ошибка геокодирования');

    //                         const { latitude, longitude } =
    //                             await response.json();

    //                         // Собираем обновленную строку

    //                         parts[
    //                             parts.length - 1
    //                         ] = `${latitude},${longitude}`;

    //                         needsUpdate = true;

    //                         return parts.join('; ');
    //                     } catch (error) {
    //                         console.error(
    //                             `Ошибка геокодирования для адреса: ${address}`,
    //                             error
    //                         );

    //                         return vItem; // Оставляем как есть в случае ошибки
    //                     }
    //                 })
    //             );

    //             // Если были изменения в V, обновляем элемент

    //             if (item.V.some((v, i) => v !== updatedV[i])) {
    //                 item.V = updatedV;
    //             }
    //         }

    //         // Если были изменения, обновляем состояние

    //         if (needsUpdate) {
    //             onCellChange(updatedData);

    //             return true; // Возвращаем true, если были изменения
    //         }

    //         return false; // Возвращаем false, если изменений не было
    //     } catch (error) {
    //         console.error('Ошибка при обновлении координат:', error);

    //         return false;
    //     }
    // }  
    
async function updateCoordinatesInData() {
    try {
        const updatedData = [...data];

        let needsUpdate = false;

        const today = new Date().toISOString().split('T')[0]; // Формат YYYY-MM-DD

        for (const item of updatedData) {
            if (!item.V || item.V.length === 0) continue;

            const vItem = item.V[0];

            let parts = vItem.split(';').map((part) => part.trim());

            let address = parts[0];

            // Если строка содержит только адрес (нет разделителей ;)

            if (parts.length === 1) {
                // Преобразуем в формат "адрес; дата; координаты"

                parts = [address, today, '0,0'];

                needsUpdate = true;
            }

            // Если есть адрес и дата, но нет координат
            else if (parts.length === 2) {
                parts.push('0,0');

                needsUpdate = true;
            }

            // Проверяем координаты (последняя часть)
            const coords = parts[parts.length - 1];

            if (
                coords !== '0,0' &&
                coords.split(',').every((coord) => !isNaN(coord))
            ) {
                continue;
            }

            if (!address) continue;

            try {
                const response = await fetch(
                    `http://localhost:8888/geo/get-coords-by-address?address=${encodeURIComponent(
                        address
                    )}`
                );

                if (!response.ok) throw new Error('Ошибка геокодирования');

                const { latitude, longitude } = await response.json();

                // Обновляем координаты (последняя часть)

                parts[parts.length - 1] = `${latitude},${longitude}`;

                item.V[0] = parts.join('; ');

                needsUpdate = true;
            } catch (error) {
                console.error(
                    `Ошибка геокодирования для адреса: ${address}`,
                    error
                );

                // Если не удалось получить координаты, оставляем "0,0"

                item.V[0] = parts.join('; ');
            }
        }

        if (needsUpdate) {
            onCellChange(updatedData);

            return true;
        }

        return false;
    } catch (error) {
        console.error('Ошибка при обновлении координат:', error);

        return false;
    }
}
    
    // async function ensureValidCoordinates(item) {
    //     // Если координаты валидны - возвращаем как есть

    //     if (
    //         item.latitude &&
    //         item.longitude &&
    //         item.latitude !== '0' &&
    //         item.longitude !== '0'
    //     ) {
    //         return item;
    //     }

    //     try {
    //         // Вызываем наш эндпоинт для геокодирования

    //         const response = await fetch(
    //             `/geo/get-coords-by-address?address=${encodeURIComponent(
    //                 item.address
    //             )}`
    //         );

    //         const data = await response.json();

    //         if (response.status !== 200) {
    //             throw new Error(data.error || 'Failed to geocode address');
    //         }

    //         // Обновляем sortedData (для последующих вызовов)

    //         const updatedItem = {
    //             ...item,

    //             latitude: data.latitude,

    //             longitude: data.longitude,

    //             address: data.fullAddress || item.address,
    //         };

    //         // Находим и обновляем элемент в sortedData

    //         const index = sortedData.findIndex((i) => i.A === item.id);

    //         if (index !== -1) {
    //             sortedData[index] = {
    //                 ...sortedData[index],

    //                 V: [
    //                     `${data.fullAddress || item.address};${data.latitude},${
    //                         data.longitude
    //                     }`,
    //                 ],
    //             };
    //         }

    //         return updatedItem;
    //     } catch (error) {
    //         console.error(
    //             `Ошибка геокодирования для пункта ${item.id}:`,
    //             error
    //         );

    //         alert(
    //             `Не удалось определить координаты для адреса: ${item.address}\n\n${error.message}`
    //         );

    //         throw error; // Останавливаем процесс
    //     }
    // }

    //Обработчик отправки данных в Map
async function sendDataToTruckMap() {
    if (!sortedData || sortedData.length === 0) {
        console.error('Нет данных для отправки');
        alert('Нет данных для отправки');
        return;
    }

    const wereUpdates = await updateCoordinatesInData();

    if (wereUpdates) {
        console.log('Координаты были обновлены');
    } else {
        console.log('Все координаты уже актуальны');
    }

    try {
        // Преобразуем данные и проверяем координаты
        let truckMapData = transformDataToTruckMapFormat(sortedData);

        // // Проверяем и корректируем координаты
        // for (let i = 0; i < truckMapData.length; i++) {
        //     truckMapData[i] = await ensureValidCoordinates(truckMapData[i]);
        // }

        // // Фильтруем null (если были ошибки геокодирования)
        // truckMapData = truckMapData.filter(Boolean);

        if (truckMapData.length === 0) {
            throw new Error('Нет данных с валидными координатами');
        }

        const targetUrl = 'http://localhost:3001';
        const targetWindow = window.open(targetUrl, '_blank');

        if (targetWindow) {
            const sendMessage = () => {
                try {
                    targetWindow.postMessage(
                        {
                            type: 'UPDATE_TRUCK_MAP_DATA',
                            payload: truckMapData,
                        },

                        targetUrl
                    );

                    console.log('Данные отправлены на', targetUrl);
                } catch (error) {
                    console.error('Ошибка отправки:', error);
                }
            };

            // Первая попытка
            sendMessage();

            // Дополнительные попытки
            let attempts = 0;
            const maxAttempts = 5;
            const interval = setInterval(() => {
                attempts++;
                sendMessage();

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    console.warn('Количество попыток отправки 5');
                }
            }, 500);
        }
    } catch (error) {
        console.error('Ошибка подготовки данных:', error);
        alert(`Ошибка подготовки данных: ${error.message}`);
    }
}

    // эта функция рабочая 100% но без ensureValidCoordinates
    // function sendDataToTruckMap() {
    //     if (!sortedData || sortedData.length === 0) {
    //         console.error('Нет данных для отправки');

    //         return;
    //     }

    //     const truckMapData = transformDataToTruckMapFormat(sortedData);

    //     const targetUrl = 'http://localhost:3001';

    //     // Открываем окно и сохраняем ссылку

    //     const targetWindow = window.open(targetUrl, '_blank');

    //     if (targetWindow) {
    //         // Функция для отправки данных

    //         const sendMessage = () => {
    //             try {
    //                 targetWindow.postMessage(
    //                     {
    //                         type: 'UPDATE_TRUCK_MAP_DATA',

    //                         payload: truckMapData,
    //                     },

    //                     targetUrl
    //                 );

    //                 console.log('Данные отправлены на', targetUrl);
    //             } catch (error) {
    //                 console.error('Ошибка отправки:', error);
    //             }
    //         };

    //         // Пытаемся отправить сразу (если окно уже загружено)

    //         sendMessage();

    //         // Дополнительные попытки через интервал (на случай долгой загрузки)

    //         let attempts = 0;

    //         const maxAttempts = 5;

    //         const interval = setInterval(() => {
    //             attempts++;

    //             sendMessage();

    //             if (attempts >= maxAttempts) {
    //                 clearInterval(interval);

    //                 console.warn('Превышено количество попыток отправки');
    //             }
    //         }, 500);
    //     }
    // }

    // по идее эта функция лучше, надо разбираться
    // function sendDataToTruckMap() {
    //     if (!sortedData?.length) {
    //         console.error('Нет данных для отправки');

    //         return;
    //     }

    //     const truckMapData = transformDataToTruckMapFormat(sortedData);

    //     const targetUrl = 'http://localhost:3001';

    //     const targetWindow = window.open(targetUrl, '_blank');

    //     if (targetWindow) {
    //         let isSent = false; // Флаг успешной отправки

    //         let attempts = 0;

    //         const maxAttempts = 5;

    //         const sendMessage = () => {
    //             if (isSent) return; // Не отправлять, если уже получилось

    //             try {
    //                 targetWindow.postMessage(
    //                     { type: 'UPDATE_TRUCK_MAP_DATA', payload: truckMapData },

    //                     targetUrl
    //                 );

    //                 console.log('Данные отправлены на', targetUrl);

    //                 isSent = true; // Помечаем как успех

    //                 clearInterval(interval); // Останавливаем интервал
    //             } catch (error) {
    //                 attempts++;

    //                 console.warn(`Попытка ${attempts}: Окно ещё не готово`);

    //                 if (attempts >= maxAttempts) {
    //                     clearInterval(interval);

    //                     console.error('Достигнут лимит попыток');
    //                 }
    //             }
    //         };

    //         const interval = setInterval(sendMessage, 500);

    //         sendMessage(); // Первая попытка сразу
    //     }
    // }


    // Обработчик правого клика
    const handleContextMenu = (e, row) => {
        e.preventDefault(); // Отключаем стандартное контекстное меню браузера
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            row, // Сохраняем строку, по которой был сделан клик
        });
    };

    // Обработчик выбора пункта меню
    const handleContextMenuAction = async (action, row) => {
        try {
            if (action === 'Определить адрес') {
                // Получаем значение из столбца F
                // console.log(row)
                // console.log(row.F)

                const companyName = row.F?.value || row.F;
                // const companyName = row.F;
                let updatedRow;

                if (
                    companyName === 'Москва и область' ||
                    companyName === 'Zabiraem' ||
                    companyName === 'Otvozim'
                ) {
                    // Вызываем обработку для Москвы
                    updatedRow = await processMoscowItem(row);
                } else if (tkList.includes(companyName)) {
                    // Вызываем обработку для ТК
                    // если назвнание входит в массив тк с бд, то ищем по имени. Все остальное - по номерам
                    // Вызываем обработку для ТК по именам
                    updatedRow = await processTkItemByName(row);
                } else {
                    // Вызываем обработку для ТК по номерам
                    updatedRow = await processTkItem(row, 'Y');
                }

                const newData = data.map((item) =>
                    item.B === row.B ? updatedRow : item
                );
                onCellChange(newData);
            }

            if (action === 'Удалить адрес') {
                // console.log(row.V);
                // row.V = [];
                // updatedRow = row;
                const newData = data.map((item) =>
                    item.B === row.B ? { ...row, V: [] } : item
                );
                onCellChange(newData);
                // window.location.reload();
            }

            // Закрываем меню и сбрасываем выделение
            setContextMenu({ ...contextMenu, visible: false });
        } catch (error) {
            console.error('Ошибка обработки адреса:', error);
            alert('Произошла ошибка при обработке адреса');
        }
    };

    // const handleContextMenuAction = (action, row) => {
    //     setContextMenu({ ...contextMenu, visible: false }); // Скрываем меню
    //     console.log(`Выбран пункт: ${action} на строке ${row.B}`); // Показываем alert
    // };

    // Закрытие контекстного меню при клике вне его
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu({ ...contextMenu, visible: false });
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [contextMenu]);

    // console.log(data);
    // Эффект для единоразовой сортировки при загрузке
    useEffect(() => {
        if (
            !initialSortDone.current &&
            fileHistory.previous.length === 0 &&
            data.length > 0
        ) {
            // Выполняем сортировку
            const sortedData = [...data].sort((a, b) => {
                const compareF = compareValues(a.F, b.F);
                if (compareF !== 0) return compareF;
                return compareValues(a.S, b.S);
            });
            // // Выполняем сортировку с Memo
            // const sortedData = useMemo(() => {
            //   [...data].sort((a, b) => {
            //       const compareF = compareValues(a.F, b.F);
            //       if (compareF !== 0) return compareF;
            //       return compareValues(a.S, b.S);
            //   });
            // }, [data, order])
            // Создаем новый порядок на основе отсортированных данных
            const newOrder = sortedData.map((row) => row.B);
            onOrderChange(newOrder);
            // Помечаем сортировку как выполненную
            initialSortDone.current = true;
        }
    }, [data, fileHistory.previous.length, onOrderChange]); // зависимости нужны для гарантии загрузки асинхронных данных

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

    // Сортированные данные согласно порядку + нумерование поля A
    const sortedData = useMemo(() => {
        const orderMap = new Map(order.map((id, index) => [id, index]));

        const sorted = [...data].sort(
            (a, b) => orderMap.get(a.B) - orderMap.get(b.B)
        );

        let currentNumber = 0;
        // let prevAddress = null;

        return sorted.map((row) => {
            // const hasAddress = row.V && row.V.length > 0;
            const hasAddress = row.V[0];
            // const currentAddress = hasAddress ? row.V[0] : null;

            // if (hasAddress && currentAddress !== prevAddress) {
            if (hasAddress) {
                currentNumber += 1;
                // prevAddress = currentAddress;
            }

            return {
                ...row,
                A: currentNumber,
            };
        });
    }, [data, order]);

    // console.log(sortedData);

    // Сортированные данные согласно порядку
    // const sortedData = useMemo(() => {
    //     const orderMap = new Map(order.map((id, index) => [id, index]));

    //     return [...data].sort((a, b) => orderMap.get(a.B) - orderMap.get(b.B));
    // }, [data, order]);

    // Остальной код компонента остается без изменений

    // ... (все функции, стили и обработчики остаются как были)

    //  Модифицируйте useEffect для обработки сложных ID:**
    // Проверка обрезания текста и обновление title
    useEffect(() => {
        // console.log('Current refs:', Object.keys(cellsRef.current));
        Object.keys(cellsRef.current).forEach((key) => {
            const cell = cellsRef.current[key];
            if (!cell) return;
            // Пропускаем ячейки с интерактивными элементами
            if (cell.querySelector('input, select, textarea')) {
                cell.title = '';
                return;
            }
            // Проверка обрезания текста. Но учтем, что в E и Q текст находится в узле div
            if (cell.lastChild instanceof HTMLDivElement) {
                // console.log(cell.lastChild instanceof HTMLDivElement);
                const isTruncated =
                    cell.lastChild.scrollWidth > cell.lastChild.clientWidth;
                cell.title = isTruncated
                    ? cell.lastChild.textContent.trim()
                    : '';
            } else {
                const isTruncated = cell.scrollWidth > cell.clientWidth;
                cell.title = isTruncated ? cell.textContent.trim() : '';
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

    // Единоразовая сортировка данных

    const sortedDataOnceInTheStartApp = [...data].sort((a, b) => {
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
        // console.log(fileHistory.previous);
        // //проверим fileHistory.previous на пустой массив, чтоб сделать единоразовую сортировку
        // if (fileHistory.previous.length === 0) {
        //     sortedDataOnceInTheStartApp();
        //     console.log('1 - ', fileHistory.length);
        // }

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
            {/* Добовляем общий datalist здесь */}
            <datalist id="F_suggestions">
                {tkList.map((tk, index) => (
                    <option key={index} value={tk} />
                ))}
            </datalist>

            {/* Контекстное меню */}
            {contextMenu.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{ padding: '8px 16px', cursor: 'pointer' }}
                        // onClick={() => {
                        //     handleContextMenuAction(
                        //         'Определить адрес',
                        //         contextMenu.row
                        //     )
                        // }
                        // }
                        onClick={async () => {
                            try {
                                await handleContextMenuAction(
                                    'Определить адрес',
                                    contextMenu.row
                                );
                                // Дополнительные действия после успешного выполнения
                            } catch (error) {
                                console.error('Ошибка:', error);
                                alert('Произошла ошибка');
                            } finally {
                                setContextMenu({
                                    ...contextMenu,
                                    visible: false,
                                });
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e9ecef';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f8f9fa';
                        }}
                    >
                        Определить адрес
                    </div>

                    <div
                        style={{ padding: '8px 16px', cursor: 'pointer' }}
                        // onClick={() =>
                        //     handleContextMenuAction1(
                        //         'Удалить строку',
                        //         contextMenu.row
                        //     )
                        // }
                        onClick={async () => {
                            try {
                                await handleContextMenuAction(
                                    'Удалить адрес',
                                    contextMenu.row
                                );
                                // Дополнительные действия после успешного выполнения
                            } catch (error) {
                                console.error('Ошибка:', error);
                                alert('Произошла ошибка');
                            } finally {
                                setContextMenu({
                                    ...contextMenu,
                                    visible: false,
                                });
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#e9ecef';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f8f9fa';
                        }}
                    >
                        Удалить адрес
                    </div>
                </div>
            )}
            <div
                style={{
                    position: 'sticky',
                    top: '0px',
                    width: '100%',
                    zIndex: '10',
                    backgroundColor: 'white',
                }}
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
                <button
                    onClick={sendDataToTruckMap}
                    style={{ margin: '10px 5px', padding: '5px 15px' }}
                >
                    Отправить в карту
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
                                    tooltip={tooltip}
                                    setTooltip={setTooltip}
                                    tkList={tkList}
                                    onContextMenu={handleContextMenu} // Передаем обработчик
                                    data={data}
                                    order={order}
                                />
                            ))}
                        </SortableContext>
                    </tbody>
                </table>
            </DndContext>
            <ExcelExporter
                data={sortedData}
                fileName="client_data.xlsx"
                buttonLabel="Экспортровать в xlsx"
                buttonClass="btn-export"
            />
            <hr/>
            <SendDeliveryButton sortedData={sortedData} />
        </div>
    );
}