// Etapa 1: endpoint de verificação. Nenhum sorteio real é realizado aqui.
export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/v1/health') {
      return Response.json({ status: 'ok', service: 'amigo-secreto-api', stage: 1 }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }
    return Response.json({ error: 'Endpoint não implementado' }, { status: 404 });
  }
};
