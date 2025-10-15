import { Button } from '../../../shared/Button/Button';
import CodeExample from './../../assets/code_example.png'
import styles from './codeinstructions.module.css';

interface Props {
    closeModal: () => void,
}

export const CodeInstructions = ({closeModal}: Props) => {
  return (
    <div
        className={styles.code_instructions}
    >
        <p>
            1. Primero tendrás que escribir tu consulta en el recuadro correspondiente:
        </p>
        <img src={CodeExample} alt="code editor example" />
        <div
            className={styles.code_instructions__button_explanation}
        >
            <p>
                2. Una vez hayas escrito tu consulta, tendrás que presionar el botón
            </p>
            <Button
                onClick={() => {

                }}
            >
                Valida
            </Button>
            <p>
                para verificarla
            </p>
        </div>
        <p>
            3. Si tu consulta se validó correctamente, podrás ingresar a la sección “Convierte” para que puedas observar tu consulta en su versión de álgebra relacional.
        </p>
        <div
            className={styles.button_container}
        >
            <Button
                onClick={closeModal}
            >
                Cerrar
            </Button>
        </div>
    </div>
  )
}
