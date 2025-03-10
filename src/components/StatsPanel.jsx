import { customRound } from "../utils/helpersFunctions";

const StatsPanel = ({ data }) => {
    const calculateSums = () => {
        let moJ = 0,
            moK = 0,
            pkJ = 0,
            pkK = 0;

        data.forEach((row) => {
            const valueB = String(row.B || '').toLowerCase();
            const j = Number(row.J) || 0;
            const k = Number(row.K) || 0;
            if (valueB.startsWith('мо') || valueB.startsWith('тл')) {
                moJ += j;
                moK += k;
            } else if (valueB.startsWith('пк')) {
                pkJ += j;
                pkK += k;
            }
        });

        return {
            mo: { J: moJ, K: moK },
            pk: { J: pkJ, K: pkK },
            total: {
                J: moJ + pkJ,
                K: moK + pkK,
            },
        };
    };

    const sums = calculateSums();

    return (
        <div
            style={{
                margin: '20px 0',
                padding: '3px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '30px',
                    justifyContent: 'space-around',
                }}
            >
                {/* <h4>{sums.total.J} кг</h4> */}
                {/* <h4>{sums.total.K} м.куб.</h4> */}

                <div
                    style={{
                        display: 'flex',
                        // marginBottom: '20px',
                        gap: '30px',
                        alignItems: 'center',
                    }}
                >
                    <span>ОлМа:</span>
                    {/* <div>Вес: {sums.pk.J} кг</div> */}
                    <div>Объем: {customRound(sums.pk.K, 3)} м.куб.</div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        // marginBottom: '20px',
                        gap: '30px',
                        alignItems: 'center',
                    }}
                >
                    <span>Монолит/АСД:</span>
                    {/* <div>Вес: {customRound(sums.mo.J, 1)} кг</div> */}
                    <div>
                        Объем: {customRound(sums.mo.K, 3)} м.куб.
                    </div>
                </div>
            </div>

            {/* <div style={{ borderTop: '2px solid #666', paddingTop: '15px' }}>
                <h4>{sums.total.J}</h4>
                <h4>{sums.total.K}</h4>
            </div> */}
        </div>
    );
};

export default StatsPanel;