import { useState, useEffect } from 'react';

const CloseWindowConfirm = () => {
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();

            setShowConfirm(true);

            e.returnValue = ''; // Обязательно для работы в некоторых браузерах

            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const handleClose = () => {
        // eslint-disable-next-line no-undef
        window.removeEventListener('beforeunload', handleBeforeUnload);

        window.close(); // Работает только для окон, открытых через window.open()

        // Для обычных вкладок лучше просто разрешить закрытие:

        setShowConfirm(false);
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    return showConfirm ? (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>Закрыть окно?</h3>

                <div style={styles.buttonGroup}>
                    <button style={styles.button} onClick={handleCancel}>
                        Отмена
                    </button>

                    <button style={styles.confirmButton} onClick={handleClose}>
                        Ок
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

const styles = {
    overlay: {
        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0,0,0,0.5)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 1000,
    },

    modal: {
        backgroundColor: 'white',

        padding: '20px',

        borderRadius: '8px',

        maxWidth: '400px',

        width: '90%',
    },

    buttonGroup: {
        display: 'flex',

        justifyContent: 'flex-end',

        gap: '10px',

        marginTop: '20px',
    },

    button: {
        padding: '8px 16px',

        border: 'none',

        borderRadius: '4px',

        cursor: 'pointer',
    },

    confirmButton: {
        backgroundColor: '#2196F3',

        color: 'white',
    },
};

export default CloseWindowConfirm;
