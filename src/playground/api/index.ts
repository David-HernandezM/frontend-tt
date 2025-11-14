// api.ts
import axios from "axios";
// import MockAdapter from "axios-mock-adapter";
import { BASE_URL } from "../../shared/consts";
import { sleep } from "../../utils";

export interface ApiResponse {
    ok: boolean,
    errors: string[],
    message: string
}

export interface ApiConvertionResponse {
    algebraRelacional: string,
    pasos: string[]
}

interface ServerResponse {
    tipo: string;
    contenido: string;
    tipoDetallado: string;
}

export const api = axios.create({ baseURL: BASE_URL });

const formatMessages = (messages: ServerResponse[], isOk: boolean): ApiResponse => {
    const response: ApiResponse = {
        ok: isOk,
        errors: [],
        message: isOk ? "Consulta valida" : "Consulta invalida"
    };

    if (!isOk) {
        messages.forEach(message => {
            response.errors.push(`${message.tipoDetallado}: ${message.contenido}`);
        });
    }

    return response;
}

const formatSteps = (steps: string[]): string => {
    const newSteps = steps.map(step => `${step}\n`);
    return newSteps.join('');
}

const getApiResponse = async (url: string, data: any) => {
    return new Promise<ApiResponse | string>(async (resolve, reject) => {
        try {
            const result = (await api.post(url, data)).data;

            if ("mensajes" in result) {
                resolve(formatMessages(result.mensajes, true));
            } else {
                resolve(formatSteps(result.pasos));
            }
        } catch(error: any) {
            const errors = formatMessages(error.response.data.mensajes, false);
            reject(errors);
        }
    });
}


export const validateSchema = async (data: any): Promise<ApiResponse> => {
    try {
        return await getApiResponse('sintaxis', data) as ApiResponse;
    } catch(error: any) {
        return error;
    }
};

export const transformQuery = async (data: any): Promise<string> => {
    try {
        return await getApiResponse('convert', data) as string;
    } catch (error: any) {
        return error;
    }
}



export const transformQueryTest = async (_data: any): Promise<ApiResponse> => {
    // const result = await api.post('transform', data);
    const toReturn = {
        ok: true, 
        errors: [],
        message:  `R1←Empleado⋈Empleado.id_departamento=Departamento.id(Departamento)\n
        R2←R1⋈Empleado.id=Proyecto.id_empleado(Proyecto)\n
        R3←oEmpleado.salario>30000∧(Departamento.nombre='Ventas'vDepartamento.nombre='Marketing')(R2)\n
        R4←yEmpleado.nombre,Departamento.nombre,COUNT(Proyecto.id)→total_proyectos(R3)`
    };

    console.log("se mando a llamar a sleep");
    await sleep(1);
    console.log("desperto!");

    return toReturn;
}

// export function setupMocks() {
//     const mock = new AxiosMockAdapter(api, { delayResponse: 2000 }); // ← delay global (ms)

//     // mock.onPost("/sintaxis").reply((config) => {
//     //     const body = JSON.parse(config.data || "{}");
//     //     if (!body?.tables) return [400, { ok: false, error: "Missing tables" }];
//     //     if (!body?.sqlQuery) return [400, { ok: false, error: "Missing sqlQuery" }];

//     //     return [200, { ok: true, message: "Consulta valida", errors: [] }];
//     // });

//     mock.onPost("/sintaxisE").reply((config) => {
//         const body = JSON.parse(config.data || "{}");
//         if (!body?.tables) return [400, { ok: false, errors: ["Missing tables"], message: "Missing tables" }];
//         if (!body?.sqlQuery) return [400, { ok: false, errors: ["Missing sqlQuery"],  message: "Missing tables" }];

//         return [400, { 
//             ok: false, 
//             message: "Consulta valida", 
//             errors: [
//                 "La tabla “Empleadoo” no existe ", 
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido",
//                 "Operador no valido"    
//             ] 
//         }];
//     });

//     mock.onPost("/transform").reply((config) => {
//         const body = JSON.parse(config.data || "{}");
//         if (!body?.tables) return [400, { ok: false, errors: ["Missing tables"], message: "Missing tables" }];
//         if (!body?.sqlQuery) return [400, { ok: false, errors: ["Missing sqlQuery"], message: "Missing tables" }];

//         return [200, { 
//             ok: true, 
//             errors: [],
//             message:  `R1←Empleado⋈Empleado.id_departamento=Departamento.id(Departamento)\n
//              R2←R1⋈Empleado.id=Proyecto.id_empleado(Proyecto)\n
//              R3←oEmpleado.salario>30000∧(Departamento.nombre='Ventas'vDepartamento.nombre='Marketing')(R2)\n
//              R4←yEmpleado.nombre,Departamento.nombre,COUNT(Proyecto.id)→total_proyectos(R3)`
//         }];
//     });

//     // mock.onPost("/transform").reply((config) => {
//     //     const body = JSON.parse(config.data || "{}");
//     //     if (!body?.tables) return [400, { ok: false, error: "Missing tables" }];
//     //     if (!body?.sqlQuery) return [400, { ok: false, error: "Missing sqlQuery" }];

//     //     return [200, { 
//     //         ok: true, 
//     //         // data: 
            
//     //      }];
//     // });

//     // // POST /login con lógica
//     // mock.onPost("/login").reply(config => {
//     // const body = JSON.parse(config.data || "{}");
//     // if (body.email === "demo@demo.com" && body.password === "secret") {
//     //     return [200, { token: "abc123" }];
//     // }
//     // return [401, { message: "Invalid credentials" }];
//     // });

//     // // ejemplo con patrón
//     // mock.onGet(/\/todos\/\d+$/).reply(200, { id: 7, title: "Todo #7" });
// }

// úsalo sólo en dev
if (import.meta.env.VITE_MODE !== "production") {
    console.log("IS NOT OR PRODUCTION");
    // setupMocks();
}
