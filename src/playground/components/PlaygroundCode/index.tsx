import { Button } from '../../../shared/Button/Button';
import { CodeEditor } from '../CodeEditor';
import { Modal } from '../../../shared/Modal';
import { useState } from 'react';
import { Loader } from '../../../shared/Loader';
import styles from './playground_code.module.css';

interface Props {
    code: string,
    isLoading: boolean,
    onCodeChange: (code: string) => void,
    onValidateSchema: () => Promise<void>,
    validationResult: {ok: boolean, message: string, errors: string[]} | null
}

export const PlaygroundCode = ({code, onCodeChange = (_code: string) => {}, onValidateSchema, validationResult, isLoading}: Props) => {
    const [openModal, setOpenModal] = useState(false);
    // const [isLoading, setIsLoading] = useState(false);

    return (
    <div
        className={styles.playground_code}
    >
        <div
            className={styles.code_editor_container}
        >
            <h2
                className={styles.playground_code__title}
            >
                Escribe la consulta SQL
            </h2>
            <div
                className={styles.playground_code__code_container}
            >
                <CodeEditor 
                    code={code}
                    onCodeChange={onCodeChange}
                />
                {
                    !isLoading ? (
                        <Button
                            onClick={async () => {
                                if (code.trim() == "") {
                                    setOpenModal(true);
                                    return;
                                }

                                await onValidateSchema();
                            }}
                        >
                            Valida
                        </Button>
                    ) : (
                        <Loader />
                    )
                }
            </div>
        </div>
        {
            validationResult != null && (
                <div
                    className={styles.validator_message}
                >
                    <h2>
                        { validationResult.ok ? "Consulta valida ✅" : "Error en validación❗" }
                    </h2>
                    {
                        (!validationResult.ok) && (
                            validationResult.errors.map(error => {
                                return <div
                                    style={{
                                        display: "flex",
                                        gap: "20px"
                                    }}
                                >
                                    <p>❌</p>
                                    <p
                                        style={{
                                            width: "90%"
                                        }}
                                    >
                                        {error}
                                    </p>
                                </div>
                            })
                        )
                    }
                </div>
            )
        }
        <Modal
            open={openModal}
            onClose={() => setOpenModal(false)}
            title='Errror:'
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
                    No se puede enviar una consulta vacia
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
