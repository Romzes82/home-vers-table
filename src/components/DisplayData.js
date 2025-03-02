// import "./DisplayData.css";
import { useState } from "react";

export default function DisplayData({ data, onCellChange, fileHistory }) {
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const toggleColumns = () => {
    setHiddenColumns(prev => 
      prev.length === 0 ? ['C','D','H','I','N','O','P','R','S','T','U','D'] : []
      // ["A", "B", "E", "G", "J", "K", "Q", "F", "V", "L", "M"]
    )
  }

    // Определение изменений между версиями файлов
    const getChangedCells = () => {
      const changed = new Set();
      fileHistory.previous.forEach((prevRow, rowIndex) => {
        Object.keys(prevRow).forEach(header => {
          if (fileHistory.current[rowIndex]?.[header] !== prevRow[header]) {
            changed.add(`${rowIndex}-${header}`);
          }
        });
      });
      return changed;
    };

    const changedCells = getChangedCells();

  // функция для проверки изменений относительно последнего обновлений
  // const isChangedFromFiled = (rowIndex, column) => {
  //   return fileVersionData[rowIndex]?.[column] !== data[rowIndex]?.[column];
  // }

  const getCellStyle = (header, rowIndex, value) => {
    const styles = { padding: "8px" };

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
      if (changedCells.has(`${rowIndex}-${header}`)) {
      // return { ...style, backgroundColor: 'yellow' };
      styles.backgroundColor = "yellow";
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
    // console.log(value);
    const newData = data.map((row, index) =>
      index === rowIndex ? { ...row, [column]: value } : row
    );
    // возможно здесть надо определять массив в V, исходя из значения F и записывать все это в newData
    onCellChange(newData);
  };

  const handleChange_V = (rowIndex, column, e, arrForSortByFirstVal) => {
    // console.log(e.target.value);
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

    const idDatalist = e.target.list.id;

    const newData = data.map((row, index) => {
      //   if (row["B"] + "_" + column === idDatalist + "") {
      return index === rowIndex ? { ...row, [column]: resultArr } : row;
      //   }
    });

    onCellChange(newData);
  };

  if (!data.length) return null;

  const allHeaders  = Object.keys(data[0]);
  const filterHeaders = allHeaders.filter(h => !hiddenColumns.includes(h));

  // const headers = Object.keys(data[0]);
  // const headers = ["A", "B", "E", "G", "J", "K", "Q", "F", "V", "L", "M"];
  // const addresses = ['адрес_1','адрес_2']

  return (
    <div className="displayData">
      <button
        onClick={toggleColumns}
        style={{ margin: '10px 0', padding: '5px 15px'}}
      >
        {hiddenColumns.length ? 'Показать все стоблцы' : 'Скрыть неиспользуемые столбцы'}
        </button>
      {/* <datalist id="addressList">
                {addresses.map((address, index) => (
                    <option key={index} value={ address} />
                ))}
            </datalist> */}
      <table stile={{with: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            {filterHeaders.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {/* {alert(rowIndex)} */}
              {filterHeaders.map((header) => (
                <td 
                  key={header}
                  style={{ 
                    border: '1px solid #ddd',
                    ...getCellStyle(header, rowIndex)
                  }}
                >
                  {header === "F" ? (
                    <input
                      defaultValue={row[header]}
                      onBlur={(e) =>
                        handleChange(rowIndex, header, e.target.value)
                      }
                      style={{width: '10em'}}
                    />
                  ) : header === "V" ? (
                    <>
                      <input
                        // list="addressList"
                        list={row["B"] + "_V"}
                        // value={row[header][0]}
                        defaultValue={row[header][0]}
                        onBlur={(e) =>
                          handleChange_V(rowIndex, header, e, row[header])
                        }
                      />
                      <datalist id={row["B"] + "_V"}>
                        {row[header].map((address, index) => (
                          <option key={index} value={address} />
                        ))}
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
