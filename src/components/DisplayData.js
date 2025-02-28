import './DisplayData.css';

export default function DisplayData({ data, onCellChange }) {
    // const handleChange = (rowIndex, value) => {
    //     const newData = data.map((row, index) =>
    //         index === rowIndex ? { ...row, F: value } : row
    //     );

    //     onCellChange(newData);
    // };
        const handleChange = (rowIndex, column, value) => {
            const newData = data.map((row, index) =>
                index === rowIndex ? { ...row, [column]: value } : row
            );

            onCellChange(newData);
        };

    if (!data.length) return null;

    // const headers = Object.keys(data[0]);
    const headers = ['A', 'B', 'E', 'G', 'J', 'K', 'Q', 'F', 'V', 'L', 'M'];
    const addresses = ['адрес_1','адрес_2']

    return (
        <div className="displayData">
            <datalist id="addressList">
                {addresses.map((address, index) => (
                    <option key={index} value={ address} />
                ))}
            </datalist>
            <table>
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header) => (
                                <td key={header}>
                                    {header === 'F' ? (
                                        <input
                                            value={row[header]}
                                            onChange={(e) =>
                                                handleChange(
                                                    rowIndex,
                                                    header,
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : header === 'V' ? (
                                        <>
                                            <input
                                                list="addressList"
                                                value={row[header]}
                                                onChange={(e) =>
                                                    handleChange(
                                                        rowIndex,
                                                        header,
                                                        e.target.value
                                                    )
                                                }
                                            />
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
