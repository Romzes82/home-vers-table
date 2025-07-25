import './CallComponent.css';
import { useMemo } from 'react';
import { extractPhoneNumbers } from '../utils/helpersFunctions';

const CallComponent = ({ listTelForShowCall }) => {
    // const TelNums = extractPhoneNumbers(listTelForShowCall);

    // const handlePhoneClick = (phoneNumber) => {
    //         window.open(`tel:+7${phoneNumber.replace(/\D/g, '')}`, '_self');
    // };

    return useMemo(() => {
        return (
            <div
                style={{
                    // margin: '0px 0px 10px 0',
                    padding: '0px 20px 0px 20px',
                    // border: '1px solid #ff9900',
                    border: '1px solid #00000080',
                    borderRadius: '4px',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M20 15.5c-1.2 0-2.5-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.5-5.2-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.4-.5-3.6 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                </svg>
                Позвонить:
                {extractPhoneNumbers(listTelForShowCall) &&
                    extractPhoneNumbers(listTelForShowCall).map((el, index) => {
                        // Форматируем номер по маске +7 (495) 358-77-29
                        const formattedNumber = `+7 (${el.substring(
                            0,
                            3
                        )}) ${el.substring(3, 6)}-${el.substring(
                            6,
                            8
                        )}-${el.substring(8)}`;

                        return (
                            <span key={index}>
                                {index > 0 && ' || '}
                                <a
                                    className="tel-num"
                                    href={`tel:+7${el}`}
                                    // onClick={(e) => {
                                    //     e.preventDefault();
                                    //     handlePhoneClick(el);
                                    // }}
                                    // style={{
                                    //     cursor: 'pointer',
                                    //     textDecoration: 'none',
                                    //     color: 'black',
                                    // }}
                                >
                                    {formattedNumber}
                                </a>
                            </span>
                        );
                    })}
            </div>
        );
    }, [listTelForShowCall]); // Перерисовывается только при изменении listTelForShowCall
};

export default CallComponent;
