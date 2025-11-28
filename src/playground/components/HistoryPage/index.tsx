import { useState } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Button } from '../../../shared/Button/Button';
import { CodeEditor } from '../CodeEditor';
import { Modal } from '../../../shared/Modal';
import type { ExportedSchema } from '../../../utils';
import styles from './historypage.module.css';

interface Props {
    onSelectSchema: (exportedSchema: ExportedSchema) => void;
}

export const HistoryPage = ({onSelectSchema}: Props) => {
    const {
        deleteSchema,
        getShemasHistory
    } = useLocalStorage(); 

    const [codes, setCodes] = useState(getShemasHistory() ? getShemasHistory()! : []);

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
        </div>
    )
}


