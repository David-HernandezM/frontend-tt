import { Button } from '../../../shared/Button/Button';
import { CodeEditor } from '../CodeEditor';
import styles from './playground_code.module.css';

interface Props {
    code: string,
    onCodeChange: (code: string) => void,
}

export const PlaygroundCode = ({code, onCodeChange = (code: string) => {}}: Props) => {
  return (
    <div
        className={styles.playground_code}
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
            <Button>
                Valida
            </Button>
        </div>
    </div>
  )
}
