export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/data") {
      if (request.method === "GET") {
        const value = await env.IMS_KV.get("ims-app-data");
        return new Response(value || "null", {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (request.method === "POST") {
        const body = await request.text();
        await env.IMS_KV.put("ims-app-data", body);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
      return new Response("Method not allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
