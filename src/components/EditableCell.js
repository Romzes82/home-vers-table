export const EditableCell = ({ value, onChange }) => {
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <td>
            <input
                type="text"
                className="full-cell-input"
                // defaultValue={row[header]}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                    }
                }}
                // onChange={handleChange}
                // onBlur={(e) =>
                    // handleChangeTextarea()
                    // row.B,
                    // header,
                    // e.target.value
                // }
                // style={{ width: '10em' }}
            />
        </td>
    );
}