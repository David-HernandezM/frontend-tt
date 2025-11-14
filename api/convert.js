export default async function handler(req, res) {
  const backendUrl = 'http://18.220.223.115:8080/api/convert';

  try {
    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
    });

    const contentType = backendRes.headers.get('content-type') || '';
    let body;

    if (contentType.includes('application/json')) {
      body = await backendRes.json();
      res.status(backendRes.status).json(body);
    } else {
      body = await backendRes.text();
      res.status(backendRes.status).send(body);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensajes: [{ tipoDetallado: 'Error', contenido: 'Error al conectar con el backend' }] });
  }
}
