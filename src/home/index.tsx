import { Button } from '../shared/Button/Button';
import { Card } from './components/Card';
import CodeIcon from '../assets/code_icon.svg';
import DbIcon from '../assets/database_icon.svg';
import AlgebraIcon from '../assets/algebra_icon.svg';
import DescriptionImg from '../assets/description_img.png';
import styles from './styles/home.module.css';
import cx from 'clsx';

const cardData = [
  {
    title: 'Crea tu esquema',
    description: 'Define tus tablas y columnas. Este será el punto de partida para poder programar tus consultas.',
    icon: DbIcon
  },
  {
    title: 'Construye tu consulta',
    description: 'Escribe una sentencia SQL utilizando los datos del esquema creado para que sea validado posteriormente ',
    icon: CodeIcon
  },
  {
    title: 'Convierte a álgebra',
    description: 'Convierte tu consulta SQL en una expresión de álgebra relacional clara y estructurada',
    icon: AlgebraIcon
  }
];

export const Home = () => {
  return (
      <div className={cx(
        styles.home,
        styles.container,
      )}>
        <div className={cx(
            styles.container,
            styles.home__introduction_container
          )}
        >
          <h1
            className={styles.home__title}
          >
            Convierte a álgebra relacional
          </h1>
          <p
            className={styles.home___description}
          >
            Aprende sobre algebra relacional mientras creas consultas con el lenguaje de programaciòn SQL.
          </p>
          <Button
            linkData={{ url: "playground" }}
          >
            Construye ahora
          </Button>
        </div>
        <div
          className={cx(
            styles.home__cards_container
          )}
        >
          {
            cardData.map((data, index) => (
              <Card 
                key={data.title + index}
                title={data.title}
                description={data.description}
                icon={data.icon}
              />
            ))
          }
        </div>
        {/* Seccion donde se encuentra la informacion de porque aprender álgebra relacional */}
        <section
          className={styles.home__information_container}
        >
          <div
            className={styles.home__information}
          >
            <h2
              className={cx(
                styles.text_format,
                styles.home__information_title
              )}
            >
              ¿Por qué aprender álgebra relacional?
            </h2>
            <p
              className={cx(
                styles.text_format,
                styles.home__information_description
              )}
            >
              Aprender álgebra relacional es crucial ya que proporciona 
              una base teórica sólida para comprender cómo es que se 
              manipulan y consultan los datos en una base de datos relacional. 
              El aprenderlo permite entender de una manera formal cómo 
              funcionan las operaciones fundamentales como la selección, la 
              proyección, unión, entre otras. Además, el álgebra relacional 
              facilita el diseño, la optimización y validación de consultas, lo 
              cual tendrá como resultado sistemas más eficientes y confiables.
            </p>
            <p
              className={cx(
                styles.text_format,
                styles.home__information_description
              )}
            >
              Al dominarlo, se adquiere una visión lógica y estructurada del 
              manejo de la información, lo cual es esencial para cualquiera que 
              quiera profundizar en el mundo de las bases de datos y la ingeniería 
              de software.
            </p>
          </div>
          <div
            className={styles.home__information_img}
          >
            <img src={DescriptionImg} alt="img" />
          </div>
        </section>
      </div>
  )
}

