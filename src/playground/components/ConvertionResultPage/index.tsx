import { CodeEditor } from '../CodeEditor';
import { useEffect, useState } from 'react';
import { Loader } from '../../../shared/Loader';
import { ArTreeViewer } from '../ArTreeViewer';
import type { ArbolPayload } from '../../../utils/buildTreeGraph';
import styles from './convertion_result.module.css';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button/Button';
import { ReactFlowProvider } from '@xyflow/react';
import cx from "clsx";

interface Props {
    code: string,
    // algebraCode: string,
    isLoading: boolean,
    tree: ArbolPayload
}

export const ConvertionResultPage = ({code, tree, isLoading = true}: Props) => {
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    console.log(tree)
    const [isLoadingPage, setIsLoading] = useState(isLoading);

    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        console.log("Cambio el algebra");
    }, [tree]);

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
                    // code={'h\nh\nh\nh\nh\nh\nh\nh\nh\nh\nh\nh\n'}
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
                    <div
                        className={cx(
                            styles.validator_message__title_container,
                            styles.validator_message__title_container__between,
                        )}
                    >
                        <h2>Conversión:</h2>
                        <Button
                            onClick={() => setModalOpen(true)}
                        >
                            Pantalla completa
                        </Button>
                    </div>
                )
            }
            {
                !isLoadingPage && (
                    <div
                        className={styles.small_tree}
                    >
                        <ReactFlowProvider>
                            <ArTreeViewer data={tree}/>
                        </ReactFlowProvider>
                        
                    </div>
                )
            }            
        </div>
        <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title='Árbol'
        >
            <div
                className={cx(styles.tree_popup)}
            >
                <ReactFlowProvider>
                            <ArTreeViewer data={tree}/>
                        </ReactFlowProvider>
                {/* <ArTreeViewer data={tree}/> */}
                <Button
                    classname={styles.tree_popup__button}
                    onClick={() => setModalOpen(false)}
                >
                    Cerrar
                </Button>
            </div>
        </Modal>
    </div>
    )
}
