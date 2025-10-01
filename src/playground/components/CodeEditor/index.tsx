import { sql } from '@codemirror/lang-sql';
import CodeMirror from '@uiw/react-codemirror';
import styles from './code_editor.module.css';

interface Props {
    code: string,
    onCodeChange: (code: string) => void,
}

export const CodeEditor = ({code, onCodeChange = (code: string) => {}}: Props) => {
  return (
     <div
        className={styles.playground_code__editor_container}
    >
        <CodeMirror
            className={styles.playground_code__codemirror}
            value={code}
            // minHeight='240PX'
            extensions={[sql()]}
            editable={true}
            placeholder='Ingresa tu consulta'
            onChange={(value, _) => {
                onCodeChange(value);
            }}
        />
    </div>
  )
}
