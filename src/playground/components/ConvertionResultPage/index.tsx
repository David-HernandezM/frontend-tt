import { CodeEditor } from '../CodeEditor';
import { useEffect, useState } from 'react';
import { Loader } from '../../../shared/Loader';
import styles from './convertion_result.module.css';

interface Props {
    code: string,
    algebraCode: string,
    isLoading: boolean
}

export const ConvertionResultPage = ({code, algebraCode, isLoading = true}: Props) => {
    const [isLoadingPage, setIsLoading] = useState(isLoading);

    useEffect(() => {
        console.log("Cambio el algebra");
    }, [algebraCode]);

    useEffect(() => {
        console.log("cambio el is loading");
        setIsLoading(isLoading);
    }, [isLoading]);

    useEffect(() => {
        console.log("cambio el code");
    }, [code]);

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
                Consulta
            </h2>
            <div
                className={styles.playground_code__code_container}
            >
                <CodeEditor 
                    code={code}
                    onCodeChange={(_) => {}}
                    disabled={true}
                />
            </div>
        </div>
        <div
            className={styles.validator_message}
        >
            {
                isLoadingPage ? (
                    <div
                        className={styles.validator_message__title_container}
                    >
                        <h2>
                            Convirtiendo
                        </h2>
                        <Loader/>
                    </div>
                ) : (
                    <h2>Conversión:</h2>
                )
            }
            {
                !isLoadingPage && (
                    <div
                        style={{width: "90%"}}
                    >
                        <CodeEditor 
                            code={algebraCode}
                            onCodeChange={(_) => {}}
                            disabled={true}
                        />
                    </div>
                )
            }            
        </div>
    </div>
    )
}
