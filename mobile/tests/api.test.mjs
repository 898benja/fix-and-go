import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
process.env.EXPO_PUBLIC_API_URL = "http://localhost:8000/";
const source = readFileSync(new URL("../src/api.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { api, options, checkHealth, ApiError, onSessionExpired } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
test("envía token y JSON al endpoint de Django", async () => {
  global.fetch = async (url, config) => {
    assert.equal(url, "http://localhost:8000/api/v1/requests/");
    assert.equal(config.headers.Authorization, "Token fictional");
    assert.deepEqual(JSON.parse(config.body), { provider_id: 7 });
    return json({ id: 1 }, 201);
  };
  assert.deepEqual(
    await api("requests/", "fictional", "POST", { provider_id: 7 }),
    { id: 1 },
  );
});
test("login no envía Authorization", async () => {
  global.fetch = async (_, config) => {
    assert.equal(config.headers.Authorization, undefined);
    return json({ token: "fake" });
  };
  await api("auth/login/", undefined, "POST", { email: "demo@example.test" });
});
test("conserva el código 401 para cerrar sesión", async () => {
  global.fetch = async () => json({ detail: "Expired" }, 401);
  await assert.rejects(
    api("auth/me/", "expired"),
    (e) => e instanceof ApiError && e.status === 401,
  );
});
test("expone errores de validación por campo", async () => {
  global.fetch = async () =>
    json({ detail: { description: ["Mínimo 10 caracteres."] } }, 400);
  await assert.rejects(api("requests/"), /Descripción: Mínimo 10 caracteres/);
});
test("presenta credenciales inválidas sin detalles técnicos", async () => {
  global.fetch = async () => json({detail:"[ErrorDetail(string='Credenciales inválidas.', code='invalid')]"}, 400);
  await assert.rejects(api("auth/login/"), (e) => e.message === "Credenciales inválidas.");
});
test("respuesta HTML no se interpreta como JSON válido", async () => {
  global.fetch = async () =>
    new Response("<html>Error</html>", { status: 502 });
  await assert.rejects(
    api("requests/"),
    (e) => e instanceof ApiError && e.status === 502,
  );
});
test("fallo de red entrega un mensaje recuperable", async () => {
  global.fetch = async () => {
    throw new TypeError("Network request failed");
  };
  await assert.rejects(api("requests/"), /Comprueba la red/);
});
test("catálogos recorren páginas sin seguir URLs externas", async () => {
  let calls = 0;
  global.fetch = async (url) => {
    calls++;
    assert.ok(url.startsWith("http://localhost:8000/api/v1/categories/"));
    return json({
      results: [{ id: calls, name: "Demo", slug: "demo" }],
      next: calls === 1 ? "https://untrusted.test/next" : null,
    });
  };
  assert.equal((await options("categories/")).length, 2);
});
test("health valida identidad del servidor", async () => {
  global.fetch = async () =>
    json({ status: "ok", database: "ok", service: "different" });
  await assert.rejects(checkHealth(), /no está disponible/);
});
test("no pierde errores de campo cuando hay un error general", async () => {
  global.fetch = async () => json({detail:"Revisa el formulario.",field_errors:{email:["Correo inválido."]}},400);
  await assert.rejects(api("auth/register/"), e => /Revisa el formulario/.test(e.message) && /Correo electrónico: Correo inválido/.test(e.message));
});
test("no muestra HTML ni trazas del servidor", async () => {
  global.fetch = async () => json({detail:"Traceback private.py"},400);
  await assert.rejects(api("requests/"), e => !/Traceback|private.py/.test(e.message));
});
test("un reclamo inexistente puede responder JSON null", async () => {
  global.fetch = async () => json(null);
  assert.equal(await api("requests/1/dispute/"),null);
});
test("una respuesta vacía 204 es válida", async () => {
  global.fetch = async () => new Response(null,{status:204});
  assert.equal(await api("wallet/demo-card/", "token", "DELETE"),null);
});
test("un error HTML 503 muestra disponibilidad sin detalles técnicos", async () => {
  global.fetch = async () => new Response('<html>private</html>',{status:503});
  await assert.rejects(api("requests/"),/no está disponible por el momento/);
});
test("una respuesta JSON malformada no pasa por una respuesta válida", async () => {
  global.fetch = async () => new Response('{broken',{status:200});
  await assert.rejects(api("requests/"), /No pudimos leer/);
});

test("un 401 de actualización notifica solo el token afectado y permite desuscribir", async () => {
  const tokens = [];
  const unsubscribe = onSessionExpired(token => tokens.push(token));
  global.fetch = async () => json({detail:"Token vencido"},401);
  await assert.rejects(api("provider/dashboard/", "expired-token"));
  unsubscribe();
  await assert.rejects(api("provider/dashboard/", "another-token"));
  assert.deepEqual(tokens,["expired-token"]);
});
