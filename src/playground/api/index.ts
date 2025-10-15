// api.ts
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { BASE_URL } from "../../shared/consts";

export interface ApiResponse {
    ok: boolean,
    errors: string[],
    message: string
}

export const api = axios.create({ baseURL: BASE_URL });


export const validateSchema = async (data: any): Promise<ApiResponse> => {
    try {
        const result = await api.post('sintaxis', data);
        console.log("result axios;");
        console.log(result);
        return result.data;
    } catch(error: any) {
        console.log("ERRORRR EN AXIOS");
        console.log(error);
        return error.response.data;
    }
};

export const transformQueryTest = async (data: any): Promise<ApiResponse> => {
    const result = await api.post('transform', data);

    return result.data;
}

export function setupMocks() {
    const mock = new AxiosMockAdapter(api, { delayResponse: 2000 }); // ← delay global (ms)

    mock.onPost("/sintaxis").reply((config) => {
        const body = JSON.parse(config.data || "{}");
        if (!body?.tables) return [400, { ok: false, error: "Missing tables" }];
        if (!body?.sqlQuery) return [400, { ok: false, error: "Missing sqlQuery" }];

        return [200, { ok: true, message: "Consulta valida", errors: [] }];
    });

    mock.onPost("/sintaxisE").reply((config) => {
        const body = JSON.parse(config.data || "{}");
        if (!body?.tables) return [400, { ok: false, errors: ["Missing tables"], message: "Missing tables" }];
        if (!body?.sqlQuery) return [400, { ok: false, errors: ["Missing sqlQuery"],  message: "Missing tables" }];

        return [400, { 
            ok: false, 
            message: "Consulta valida", 
            errors: [
                "La tabla “Empleadoo” no existe ", 
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido",
                "Operador no valido"    
            ] 
        }];
    });

    mock.onPost("/transform").reply((config) => {
        const body = JSON.parse(config.data || "{}");
        if (!body?.tables) return [400, { ok: false, errors: ["Missing tables"], message: "Missing tables" }];
        if (!body?.sqlQuery) return [400, { ok: false, errors: ["Missing sqlQuery"], message: "Missing tables" }];

        return [200, { 
            ok: true, 
            errors: [],
            message:  `R1←Empleado⋈Empleado.id_departamento=Departamento.id(Departamento)\n
             R2←R1⋈Empleado.id=Proyecto.id_empleado(Proyecto)\n
             R3←oEmpleado.salario>30000∧(Departamento.nombre='Ventas'vDepartamento.nombre='Marketing')(R2)\n
             R4←yEmpleado.nombre,Departamento.nombre,COUNT(Proyecto.id)→total_proyectos(R3)`
        }];
    });

    // mock.onPost("/transform").reply((config) => {
    //     const body = JSON.parse(config.data || "{}");
    //     if (!body?.tables) return [400, { ok: false, error: "Missing tables" }];
    //     if (!body?.sqlQuery) return [400, { ok: false, error: "Missing sqlQuery" }];

    //     return [200, { 
    //         ok: true, 
    //         // data: 
            
    //      }];
    // });

    // // POST /login con lógica
    // mock.onPost("/login").reply(config => {
    // const body = JSON.parse(config.data || "{}");
    // if (body.email === "demo@demo.com" && body.password === "secret") {
    //     return [200, { token: "abc123" }];
    // }
    // return [401, { message: "Invalid credentials" }];
    // });

    // // ejemplo con patrón
    // mock.onGet(/\/todos\/\d+$/).reply(200, { id: 7, title: "Todo #7" });
}

// úsalo sólo en dev
if (import.meta.env.VITE_MODE !== "production") {
    console.log("IS NOT OR PRODUCTION");
  setupMocks();
}
