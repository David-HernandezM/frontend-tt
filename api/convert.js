export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const backendUrl = 'http://18.220.223.115:8080/api/convert';

  try {
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }

    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
      },
      body: rawBody,
    });

    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } else {
      const text = await backendRes.text();
      res.status(backendRes.status).send(text);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      mensajes: [{ tipoDetallado: 'Error', contenido: 'Error al conectar con el backend' }],
    });
  }
}
