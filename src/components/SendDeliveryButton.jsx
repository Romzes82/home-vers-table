import React, { useState } from 'react';

// import axios from 'axios';

const SendDeliveryButton = ({ sortedData }) => {
    const [loading, setLoading] = useState(false);

    const [results, setResults] = useState([]);

    const processAddress = (vArray) => {
        if (!vArray || vArray.length === 0) return {};

        const firstEntry = vArray[0];

        const parts = firstEntry.split(';').map((p) => p.trim());

        if (parts.length < 3) return {};

        const address = parts[0];

        // const coords = parts[2].replace(/,/g, '.').split(/\s+/);
        // console.log(parseFloat(coords[0]), parseFloat(coords[1]));

        const coordsPart = parts[parts.length - 1].trim();

        const [rawLat, rawLon] = coordsPart
            .split(',')
            .map((s) => s.trim().replace(/,/g, '.'));        

        return {
            address,

            latitude: rawLat, //parseFloat(coords[0]),

            longitude: rawLon, //parseFloat(coords[1]),
        };
    };

    const formatDate = (inputDate) => {
        const [day, month, year] = inputDate.split('.');
        // console.log(inputDate);
        // const [year, month, day] = inputDate.split('-');

        return `${day}${month}${year}`;
    };

    const handleSendData = async () => {
        setLoading(true);

        const results = [];

        try {
            const filteredData = sortedData.filter(
                (item) =>
                    item.F === 'Москва и область' ||
                    item.F === 'Zabiraem'
            );

            for (const item of filteredData) {
                try {
                    const addressData = processAddress(item.V);
// console.log(addressData.address);                    
// console.log(addressData.latitude);
// console.log(addressData.longitude);
                    if (
                        !addressData.address ||
                        isNaN(addressData.latitude) ||
                        isNaN(addressData.longitude)
                    ) {
                        results.push({
                            success: false,
                            message: `Ошибка в адресе для ${item.E}`,
                        });

                        continue;
                    }

                    // пропишем дату в Забираем
                    if (item.F === "Zabiraem") {
                        item.D = sortedData[0].D;
                    }

                    const payload = {
                        inn: item.S ? item.S : "0",

                        client: item.E,

                        address: addressData.address,

                        date: formatDate(item.D), 

                        latitude: addressData.latitude,

                        longitude: addressData.longitude,
                    };

                    // const response = await axios.post(
                    //     'http://localhost:8888/api/add-delivery',
                    //     payload
                    // );

                    const response = await fetch(
                        // 'http://localhost:8888/api/add-delivery',
                        '/api/add-delivery',

                        {
                            method: 'POST',

                            headers: {
                                'Content-Type': 'application/json',
                            },

                            body: JSON.stringify(payload),
                        }
                    );

                    const responseData = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            responseData.error || 'Неизвестная ошибка сервера'
                        );
                    }                    

                    results.push({
                        success: true,

                        message: `Успешно: ${item.E}`,

                        data: responseData,
                    });
                } catch (error) {
                    results.push({
                        success: false,

                        message: `Ошибка для ${item.E}: ${error.message}`,
                    });
                }
            }
        } catch (error) {
            console.error('Общая ошибка:', error);
        } finally {
            setLoading(false);

            setResults(results);
        }
    };

    return (
        <div>
            <button onClick={handleSendData} disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить данные в бд'}
            </button>

            <div className="results">
                {results.map((result, index) => (
                    <div
                        key={index}
                        style={{ color: result.success ? 'green' : 'red' }}
                    >
                        {result.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SendDeliveryButton;
