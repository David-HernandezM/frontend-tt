import { useEffect, useState } from 'react';
import { RadioButtonsGroup } from '../shared/RadioButtonsGroup';
import { Modal } from '../shared/Modal';
import { PlaygroundDBSchema } from './components/PlaygroundDBSchema';
import { PlaygroundCode } from './components/PlaygroundCode';
import { SchemaInstructions } from './components/SchemaInstructions';
import { CodeInstructions } from './components/CodeInstructions';
import { validateSchema, transformQueryTest } from './api';
import { buildSchemaJSON } from '../utils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ConvertionResultPage } from './components/ConvertionResultPage';
import { HistoryPage } from './components/HistoryPage';
import { Button } from '../shared/Button/Button';
// import { importSchemaJSON } from '../utils/scchemaHelper';
import { importSchemaJSON } from '../utils';
import HelpIcon from '../assets/help_icon.svg';
import styles from './styles/playground.module.css';

import {
  useNodesState, useEdgesState,
  type Node, type Edge
} from '@xyflow/react';

const initialEdges: Edge[] = [];
const initialNodes: Node[] = [];

export const PlayGround = () => {
  const { 
    openCodeInstructions, 
    openSchemaInstructions,
    setOpenCodeInstructions,
    setOpenSchemaInstructions,
    addSchemaData,
    getSchemaId,
    getShemasHistory,
    getSchemasData
  } = useLocalStorage();
  const [buttonsSelected, setButtonsSelected] = useState([true, false, false, false]);
  const [activeButtons, setActiveButtons] = useState([true, false, false,  (getShemasHistory()?getShemasHistory()!:[]).length > 0]);
  // const [activeButtons, setActiveButtons] = useState([true, true, true, true]);
  const [code, setCode] = useState("");
  const [algebraCode, setAlgebraCode] = useState("");
  const [isLoadingVerificationResult, setIsLoadingVerificationResult] = useState(false);
  const [isLoadingAlgebraResult, setIsLoadingAlgebraResult] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [open, setOpen] = useState(false);
  const [schemaInstructions, setschemaInstructions] = useState(true);
  const [validationResult, setValidationResult] = useState<{ok: boolean, message: string, errors: string[]} | null>(null);
  const [openErrorModal, setOpenErrorModal] = useState(false);

  const onButtonSelectedChange = (id: number) => {
    const buttonsSelected = Array(4).fill(false);
    buttonsSelected[id] = true;

    setButtonsSelected(buttonsSelected);
  }

  useEffect(() => {
    if (buttonsSelected[0] && openSchemaInstructions()) {
      setOpenSchemaInstructions(false);
      setOpen(true);
    } else if (buttonsSelected[1] && openCodeInstructions()) {
      setOpenCodeInstructions(false);
      setOpen(true);
      setschemaInstructions(false);
    }
  }, [buttonsSelected]);

  useEffect(() => {
    if (nodes.length > 0) {
      setActiveButtons([true, true, false, activeButtons[3]]);
    } else {
      setActiveButtons([true, false, false, activeButtons[3]]);
    }

  }, [nodes, code])

  return (
    <div
      className={styles.playground}
    >
      <div
        className={styles.playground__options}
      >
        <RadioButtonsGroup
          groupName='PlaygroundOptions'
          buttonsTitles={["Crea", "Programa", "Convierte", "Historial"]}
          initialButtonsSelected={buttonsSelected}
          activeButtons={activeButtons}
          styleUnselected={true}
          onButtonSelected={onButtonSelectedChange}
        />
        <div
          className={styles.playground__help_icon}
        >
          <img src={HelpIcon} alt="Help icon" onClick={() => {
            if (buttonsSelected[0] || buttonsSelected[1]) {
              setOpen(true);
            }

            if (buttonsSelected[0]) {
              setschemaInstructions(true);
            } else {
              setschemaInstructions(false);
            }
          }}/>
        </div>
      </div>
      <div
        className={styles.playground__canvas}
      >
        { buttonsSelected[0] && <PlaygroundDBSchema nodes={nodes} edges={edges} setEdges={setEdges} setNodes={setNodes} onEdgesChange={onEdgesChange} onNodesChange={onNodesChange} /> }
        { buttonsSelected[1] && 
          <PlaygroundCode 
            isLoading={isLoadingVerificationResult}
            code={code} 
            onCodeChange={(newCode) => setCode(newCode)} 
            onValidateSchema={async () => {
              // setValidationResult(null);
              // setIsLoadingVerificationResult(true);
              
              const data = buildSchemaJSON(nodes, edges, code);

              const result = await validateSchema(data);

              console.log(result);

              return;

              setIsLoadingVerificationResult(false);

              console.log("result");
              console.log(result);
              setValidationResult(result);

              let lastActiveButtons = [...activeButtons];
              lastActiveButtons[3] = true;

              setActiveButtons(lastActiveButtons);

              if (!result.ok) {
                console.log("EL RESULTADO NO FUE CORRECTO");
                return;
              }

              const currentSchemaId = getSchemaId(data);
              const schemaData = getSchemasData(currentSchemaId);

              if (!schemaData) {
                console.log("NO EXISTE GUARDANDO!");
                const resultSaveSchema = addSchemaData(data);
                // const activeButtons = [...lastActiveButtons]

                if (!resultSaveSchema) {
                  console.error("Error al guardar los datos!");
                  setOpenErrorModal(true);
                  return;
                }
              } else {
                console.log("YA EXISTEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
              }
              

              lastActiveButtons[2] = true;
              setActiveButtons(lastActiveButtons);

              setIsLoadingAlgebraResult(true);

              const transformResult = await transformQueryTest(data);

              setAlgebraCode(transformResult.message);
              setIsLoadingAlgebraResult(false);

              
            }}
            validationResult={validationResult}
          /> 
        }
        {
          buttonsSelected[2] && 
          <ConvertionResultPage
            code={code}
            algebraCode={algebraCode}
            isLoading={isLoadingAlgebraResult}
          />
        }
        {
          buttonsSelected[3] &&
          <HistoryPage 
            onSelectSchema={(exportedSchema) => {
              const { nodes, edges, code } = importSchemaJSON(exportedSchema);

              setCode(code);
              setNodes(nodes);
              setEdges(edges);
            }}
          />
        }
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={schemaInstructions ? "¿Cómo se editan las tablas?" : "Como convertir tu consulta"}>
        {
          schemaInstructions ? (
            <SchemaInstructions closeModal={() => { setOpen(false) }} />
          ) : (
            <CodeInstructions 
              closeModal={() => { setOpen(false) }}
            />
          ) 
        }
      </Modal>
      <Modal
          open={openErrorModal}
          onClose={() => setOpenErrorModal(false)}
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
                  El esquema ya existe en el historial.
              </p>
              <div
              style={{
                  display: 'flex',
                  justifyContent: 'end'
              }}
              >
              <Button
                  onClick={() => setOpenErrorModal(false)}
              >
                  Aceptar
              </Button>
              </div>
          </div>
      </Modal>
    </div>
  )
}
