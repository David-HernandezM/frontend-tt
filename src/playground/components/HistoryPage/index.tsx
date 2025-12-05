import { useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Button } from '../../../shared/Button/Button';
import { CodeEditor } from '../CodeEditor';
import type { ExportedSchema } from '../../../utils';
import styles from './historypage.module.css';
import { Modal } from '../../../shared/Modal';

interface Props {
    onSelectSchema: (exportedSchema: ExportedSchema) => void;
}

export const HistoryPage = ({onSelectSchema}: Props) => {
    const {
        deleteSchema,
        getShemasHistory
    } = useLocalStorage(); 

    const [codes, setCodes] = useState(getShemasHistory() ? getShemasHistory()! : []);
    const [openModal, setOpenModal] = useState(false);

    return (
        <div
            className={styles.history_page}
        >
            {
                // Object.entries(codes).map(([key, value]) => {
                codes.map(([key, schemaData]) => {
                    return (
                        <div
                            className={styles.history_card}
                        >
                            <CodeEditor
                                code={schemaData.sqlQuery}
                                onCodeChange={(_) => {}}
                                disabled={true}
                            />
                            <div
                                className={styles.buttons_container}
                            >
                                <Button
                                    onClick={() => {
                                        onSelectSchema(schemaData);
                                        setOpenModal(true);
                                    }}
                                >
                                    Usar
                                </Button>
                                <Button
                                    isRed={true}
                                    onClick={() => {
                                        deleteSchema(key);
                                        setCodes(getShemasHistory() ? getShemasHistory()! : [])
                                    }}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    )
                })
            }
            <Modal
                open={openModal}
                onClose={() => setOpenModal(false)}
                title='Actualización:'
                >
                <div
                    style={{
                    display: 'flex',
                    flexDirection: 'column'
                    }}
                >
                    <p
                    style={{
                        textAlign: 'center',
                        color: 'black',
                        fontSize: 20,
                        padding: "0 50px",
                        width: 500
                    }}
                    >
                        Se actualizo el esquema de base de datos y consulta SQL.
                    </p>
                    <div
                    style={{
                        display: 'flex',
                        justifyContent: 'end'
                    }}
                    >
                    <Button
                        onClick={() => setOpenModal(false)}
                    >
                        Aceptar
                    </Button>
                    </div>
                </div>
            </Modal>
        </div>

    )
}


