import AddColumnImg from './../../assets/add_column.png';
import DeleteColumnImg from './../../assets/delete_column.png';
import PrimaryKeyImg from './../../assets/primarykey_column.png';
import TypeColumn from './../../assets/type_column.png';
import SchemaExampleImg from './../../assets/shcema_example.png';
import RemoveTableImg from './../../assets/x-circle.svg'
import { Button } from '../../../shared/Button/Button';
import styles from './schema_instructions.module.css';
import cx from 'clsx';
 
interface Props {
  closeModal: () => void
}

export const SchemaInstructions = ({ closeModal }: Props) => {
  return (
    <div>
      <div
        className={styles.information_container}
      >
          <div>
            <div
              className={styles.information}
            >
              <img src={DeleteColumnImg} alt="Delete column image" />
              <p>
                Al presionarlo en una columna, eliminara la columna seleccionada
              </p>
            </div>
            <div
              className={styles.information}
            >
              <img src={PrimaryKeyImg} alt="Primary key column image" />
              <p>
                Al presionarlo, convierte a la columna seleccionada en llave primaria.
              </p>
            </div>
            <div
              className={styles.information}
            >
              <img src={TypeColumn} alt="Type column image" />
              <p>
                Al presionarlo, mostrará una tabla en la cual se mostraran los tipos de dato que puede asumir la columna
              </p>
            </div>
            <div
              className={styles.information}
            >
              <img src={AddColumnImg} alt="Add column img" />
              <p>
                Al presionarlo, agregara una nueva columna en la tabla.
              </p>
            </div>
            <div
              className={styles.information}
            >
              <img src={RemoveTableImg} alt="Remove table icon" />
              <p>
                Elimina la tabla completa.
              </p>
            </div>
            <div
              className={styles.information}
            >
              <div className={styles.rectangle_example} />
              <p>
                Al presionarlo, este creara una unión de llave foránea, en donde se le tiene que presionar después al 
                objetivo, que seria la columna objetivo, el color es para ubicar en donde se encuentra (recuadro azul).
              </p>
            </div>
            <div
              className={styles.information}
            >
              <div 
                className={cx(
                  styles.rectangle_example,
                  styles.rectangle_example_red
                )} 
              />
              <p>
                Recuadro objetivo en el cual se enlazará la llave foránea, el color es para ubicar en donde se encuentra
              </p>
            </div>
          </div>
          <div
            className={styles.schema_imf_container}
          >
            <img src={SchemaExampleImg} alt="Schema example" />
          </div>
      </div>
      <div
        className={styles.exit_button_container}
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
