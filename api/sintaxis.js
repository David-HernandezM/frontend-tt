// api/sintaxis.js  (Vercel Node.js Serverless Function)

export default async function handler(req, res) {
  const backendUrl = 'http://18.220.223.115:8080/api/sintaxis';

  try {
    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? undefined : JSON.stringify(req.body || {}),
    });

    const text = await backendRes.text();

    res.status(backendRes.status).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error while connecting with the backend' });
  }
}
