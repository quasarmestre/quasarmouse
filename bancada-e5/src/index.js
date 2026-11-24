// MemoCore — bancada E5.1 (cupom 61): Worker de bancada descartavel.
// NAO e o Worker de producao `orvalumi` — e um recurso de bancada com
// nome proprio (memocore-bancada-e5), fora da copia oficial do repo.
// Funcoes:
//   - rotas proprias: /preparar (gera objeto de teste de 256 MiB no R2,
//     em partes de 32 MiB), /receber-pdf (PUT do PDF do corpus),
//     /documento.pdf e /objeto.bin (leitura do R2, com Range),
//     /estado (tamanhos no R2);
//   - tudo o resto vai para o Container (harness de medicao na porta 8080).
import { Container, getContainer } from "@cloudflare/containers";

const HARNESS_B64 = "IyBCYW5jYWRhIEU1LjEg4oCUIGhhcm5lc3MgSFRUUCBxdWUgY29ycmUgREVOVFJPIGRvIENvbnRhaW5lciAoZW50cnlwb2ludCkuCiMgTk9UQSBERSBCQU5DQURBIChSb3RhIEIpOiBhIGltYWdlbSBlbSB0ZXN0ZSDDqSBhIHDDumJsaWNhIHB5dGhvbjozLjEyLXNsaW0KIyAoYSBSb3RhIEEvQnVpbGRzIGZpY291IGJsb3F1ZWFkYSBubyBwcsOpLXJlcXVpc2l0byBtYW51YWwgZGEgR2l0SHViIEFwcCkuCiMgTU9ERUxPIFBVU0g6IG8gQ29udGFpbmVyIE7Dg08gY29uc2VndWUgaXIgYnVzY2FyIGZpY2hlaXJvcyBhbyBob3N0bmFtZSBkbwojIHByw7NwcmlvIFdvcmtlciAoYSBwbGF0YWZvcm1hIHJlc3BvbmRlIDQwMyDigJQgbWVkaWRvIGVtIDIwMjYtMTEtMjQsIHZlciBhCiMgcHJvdmEpLiBQb3IgaXNzbyBvIFdvcmtlciBsw6ogZG8gUjIgZSBFTlZJQSBvcyBieXRlcyBhbyBDb250YWluZXIgcG9yIFBPU1Q6CiMgICBHRVQgIC8gICAgICAgICAgLT4gc2HDumRlIChwcm92YSBxdWUgbyBDb250YWluZXIgcmVzcG9uZGUpCiMgICBHRVQgIC92ZXJzb2VzICAgLT4gcHJlc2Vuw6dhL3ZlcnPDtWVzIGRhcyBmZXJyYW1lbnRhcyBuYSBpbWFnZW0KIyAgIFBPU1QgL2V4dHJhaXIgICAtPiByZWNlYmUgbyBQREYgbm8gY29ycG8sIGNvcnJlIHBkZnRvdGV4dCAoZnVtYcOnYSBkZSBleHRyYXRvcjsKIyAgICAgICAgICAgICAgICAgICAgICBpbnN0YWxhIHBvcHBsZXItdXRpbHMgcG9yIGFwdCBuYSAxLsKqIHZleiwgdGVtcG8gcmVwb3J0YWRvKQojICAgUE9TVCAvdmF6YW8tcGFydGU/cGFydGU9TlsmcmVzZXQ9MV0gLT4gcmVjZWJlIHVtYSBmYWl4YSBkZSAzMiBNaUIgbm8gY29ycG8sCiMgICAgICAgICAgICAgICAgICAgICAgY29udGEgYnl0ZXMgZSBjcm9ub21ldHJhIGEgcmVjZcOnw6NvOyBhY3VtdWxhIG8gdG90YWwKaW1wb3J0IGpzb24KaW1wb3J0IG9zCmltcG9ydCBzaHV0aWwKaW1wb3J0IHN1YnByb2Nlc3MKaW1wb3J0IHRpbWUKZnJvbSBodHRwLnNlcnZlciBpbXBvcnQgQmFzZUhUVFBSZXF1ZXN0SGFuZGxlciwgVGhyZWFkaW5nSFRUUFNlcnZlcgpmcm9tIHVybGxpYi5wYXJzZSBpbXBvcnQgcGFyc2VfcXMsIHVybHBhcnNlCgpFU1RBRE8gPSB7InRvdGFsIjogMCwgInBhcnRlcyI6IFtdfQoKCmRlZiBjb3JyZShjbWQsIHRpbWVvdXQ9MTIwKToKICAgIHRyeToKICAgICAgICBwID0gc3VicHJvY2Vzcy5ydW4oY21kLCBzaGVsbD1UcnVlLCBjYXB0dXJlX291dHB1dD1UcnVlLCB0ZXh0PVRydWUsIHRpbWVvdXQ9dGltZW91dCkKICAgICAgICByZXR1cm4gKHAuc3Rkb3V0IG9yIHAuc3RkZXJyIG9yICIiKS5zdHJpcCgpLnNwbGl0KCJcbiIpWzBdWzoyMDBdCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcmV0dXJuICJFUlJPOiAiICsgc3RyKGUpWzoxMjBdCgoKY2xhc3MgSChCYXNlSFRUUFJlcXVlc3RIYW5kbGVyKToKICAgIGRlZiBsb2dfbWVzc2FnZShzZWxmLCAqYSk6CiAgICAgICAgcGFzcwoKICAgIGRlZiBzZW5kX2pzb24oc2VsZiwgb2JqLCBjb2RlPTIwMCk6CiAgICAgICAgYm9keSA9IGpzb24uZHVtcHMob2JqKS5lbmNvZGUoKQogICAgICAgIHNlbGYuc2VuZF9yZXNwb25zZShjb2RlKQogICAgICAgIHNlbGYuc2VuZF9oZWFkZXIoIkNvbnRlbnQtVHlwZSIsICJhcHBsaWNhdGlvbi9qc29uIikKICAgICAgICBzZWxmLnNlbmRfaGVhZGVyKCJDb250ZW50LUxlbmd0aCIsIHN0cihsZW4oYm9keSkpKQogICAgICAgIHNlbGYuZW5kX2hlYWRlcnMoKQogICAgICAgIHNlbGYud2ZpbGUud3JpdGUoYm9keSkKCiAgICBkZWYgZG9fR0VUKHNlbGYpOgogICAgICAgIHRyeToKICAgICAgICAgICAgaWYgc2VsZi5wYXRoID09ICIvIiBvciBzZWxmLnBhdGguc3RhcnRzd2l0aCgiL3NhdWRlIik6CiAgICAgICAgICAgICAgICBzZWxmLnNlbmRfanNvbih7Im9rIjogVHJ1ZSwgInNlcnZpY28iOiAibWVtb2NvcmUtYmFuY2FkYS1lNSJ9KQogICAgICAgICAgICBlbGlmIHNlbGYucGF0aC5zdGFydHN3aXRoKCIvdmVyc29lcyIpOgogICAgICAgICAgICAgICAgc2VsZi5zZW5kX2pzb24oewogICAgICAgICAgICAgICAgICAgICJpbWFnZW1fYmFuY2FkYSI6ICJkb2NrZXIuaW8vbGlicmFyeS9weXRob246My4xMi1zbGltIChSb3RhIEIpIiwKICAgICAgICAgICAgICAgICAgICAicGRmdG90ZXh0X3ByZXNlbnRlIjogYm9vbChzaHV0aWwud2hpY2goInBkZnRvdGV4dCIpKSwKICAgICAgICAgICAgICAgICAgICAicGRmdG90ZXh0IjogY29ycmUoInBkZnRvdGV4dCAtdiAyPiYxIHwgaGVhZCAtMSIpLAogICAgICAgICAgICAgICAgICAgICJweXRob24iOiBjb3JyZSgicHl0aG9uMyAtLXZlcnNpb24iKSwKICAgICAgICAgICAgICAgICAgICAidGVzc2VyYWN0X3ByZXNlbnRlIjogYm9vbChzaHV0aWwud2hpY2goInRlc3NlcmFjdCIpKSwKICAgICAgICAgICAgICAgICAgICAiZmZtcGVnX3ByZXNlbnRlIjogYm9vbChzaHV0aWwud2hpY2goImZmbXBlZyIpKSwKICAgICAgICAgICAgICAgICAgICAic29mZmljZV9wcmVzZW50ZSI6IGJvb2woc2h1dGlsLndoaWNoKCJzb2ZmaWNlIikpLAogICAgICAgICAgICAgICAgfSkKICAgICAgICAgICAgZWxpZiBzZWxmLnBhdGguc3RhcnRzd2l0aCgiL2V4dHJhaXIiKSBvciBzZWxmLnBhdGguc3RhcnRzd2l0aCgiL3ZhemFvIik6CiAgICAgICAgICAgICAgICBzZWxmLnNlbmRfanNvbih7ImVycm8iOiAibW9kZWxvIHB1c2g6IHVzYXIgUE9TVCAobyBwdWxsIGRvIHByb3ByaW8gV29ya2VyIGRldm9sdmUgNDAzKSJ9LCA0MDUpCiAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICBzZWxmLnNlbmRfanNvbih7ImVycm8iOiAicm90YSBkZXNjb25oZWNpZGEifSwgNDA0KQogICAgICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICAgICAgc2VsZi5zZW5kX2pzb24oeyJlcnJvIjogc3RyKGUpWzozMDBdfSwgNTAwKQoKICAgIGRlZiBkb19QT1NUKHNlbGYpOgogICAgICAgIHRyeToKICAgICAgICAgICAgaWYgc2VsZi5wYXRoLnN0YXJ0c3dpdGgoIi9leHRyYWlyIik6CiAgICAgICAgICAgICAgICB0MCA9IHRpbWUudGltZSgpCiAgICAgICAgICAgICAgICBuID0gaW50KHNlbGYuaGVhZGVycy5nZXQoIkNvbnRlbnQtTGVuZ3RoIiwgIjAiKSkKICAgICAgICAgICAgICAgIHdpdGggb3BlbigiL3RtcC9kb2MucGRmIiwgIndiIikgYXMgZjoKICAgICAgICAgICAgICAgICAgICByZXN0ID0gbgogICAgICAgICAgICAgICAgICAgIHdoaWxlIHJlc3QgPiAwOgogICAgICAgICAgICAgICAgICAgICAgICBjaHVuayA9IHNlbGYucmZpbGUucmVhZChtaW4oMTAyNCAqIDEwMjQsIHJlc3QpKQogICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgY2h1bms6CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhawogICAgICAgICAgICAgICAgICAgICAgICBmLndyaXRlKGNodW5rKQogICAgICAgICAgICAgICAgICAgICAgICByZXN0IC09IGxlbihjaHVuaykKICAgICAgICAgICAgICAgIHQxID0gdGltZS50aW1lKCkKICAgICAgICAgICAgICAgIGluc3RhbGxfcyA9IE5vbmUKICAgICAgICAgICAgICAgIGlmIG5vdCBzaHV0aWwud2hpY2goInBkZnRvdGV4dCIpOgogICAgICAgICAgICAgICAgICAgIHRpID0gdGltZS50aW1lKCkKICAgICAgICAgICAgICAgICAgICBzdWJwcm9jZXNzLnJ1bigiYXB0LWdldCB1cGRhdGUgLXFxICYmIGFwdC1nZXQgaW5zdGFsbCAteSAtcXEgcG9wcGxlci11dGlscyIsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hlbGw9VHJ1ZSwgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTYwMCkKICAgICAgICAgICAgICAgICAgICBpbnN0YWxsX3MgPSByb3VuZCh0aW1lLnRpbWUoKSAtIHRpLCAzKQogICAgICAgICAgICAgICAgcCA9IHN1YnByb2Nlc3MucnVuKFsicGRmdG90ZXh0IiwgIi90bXAvZG9jLnBkZiIsICIvdG1wL2RvYy50eHQiXSwKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXB0dXJlX291dHB1dD1UcnVlLCB0ZXh0PVRydWUsIHRpbWVvdXQ9MzAwKQogICAgICAgICAgICAgICAgdDIgPSB0aW1lLnRpbWUoKQogICAgICAgICAgICAgICAgdHh0ID0gb3BlbigiL3RtcC9kb2MudHh0IiwgInJiIikucmVhZCgpIGlmIG9zLnBhdGguZXhpc3RzKCIvdG1wL2RvYy50eHQiKSBlbHNlIGIiIgogICAgICAgICAgICAgICAgcHJpbWVpcmEgPSB0eHQuZGVjb2RlKCJ1dGYtOCIsICJyZXBsYWNlIikuc3RyaXAoKS5zcGxpdCgiXG4iKVswXVs6MTIwXSBpZiB0eHQgZWxzZSAiIgogICAgICAgICAgICAgICAgc2VsZi5zZW5kX2pzb24oewogICAgICAgICAgICAgICAgICAgICJtb2RlbG8iOiAicHVzaCAoV29ya2VyIGxlIGRvIFIyIGUgZW52aWEgYW8gQ29udGFpbmVyKSIsCiAgICAgICAgICAgICAgICAgICAgInBvcHBsZXJfaW5zdGFsbF9zIjogaW5zdGFsbF9zLAogICAgICAgICAgICAgICAgICAgICJwZGZ0b3RleHRfdmVyc2FvIjogY29ycmUoInBkZnRvdGV4dCAtdiAyPiYxIHwgaGVhZCAtMSIpLAogICAgICAgICAgICAgICAgICAgICJwZGZfYnl0ZXMiOiBvcy5wYXRoLmdldHNpemUoIi90bXAvZG9jLnBkZiIpLAogICAgICAgICAgICAgICAgICAgICJyZWNlcGNhb19zIjogcm91bmQodDEgLSB0MCwgMyksCiAgICAgICAgICAgICAgICAgICAgInBkZnRvdGV4dF9yYyI6IHAucmV0dXJuY29kZSwKICAgICAgICAgICAgICAgICAgICAicGRmdG90ZXh0X3MiOiByb3VuZCh0MiAtIHQxLCAzKSwKICAgICAgICAgICAgICAgICAgICAidHh0X2J5dGVzIjogbGVuKHR4dCksCiAgICAgICAgICAgICAgICAgICAgInByaW1laXJhX2xpbmhhIjogcHJpbWVpcmEsCiAgICAgICAgICAgICAgICB9KQogICAgICAgICAgICBlbGlmIHNlbGYucGF0aC5zdGFydHN3aXRoKCIvdmF6YW8tcGFydGUiKToKICAgICAgICAgICAgICAgIHEgPSBwYXJzZV9xcyh1cmxwYXJzZShzZWxmLnBhdGgpLnF1ZXJ5KQogICAgICAgICAgICAgICAgaWYgcS5nZXQoInJlc2V0IiwgWyIwIl0pWzBdID09ICIxIjoKICAgICAgICAgICAgICAgICAgICBFU1RBRE9bInRvdGFsIl0gPSAwCiAgICAgICAgICAgICAgICAgICAgRVNUQURPWyJwYXJ0ZXMiXSA9IFtdCiAgICAgICAgICAgICAgICBuX2Fsdm8gPSBpbnQoc2VsZi5oZWFkZXJzLmdldCgiQ29udGVudC1MZW5ndGgiLCAiMCIpKQogICAgICAgICAgICAgICAgdDAgPSB0aW1lLnRpbWUoKQogICAgICAgICAgICAgICAgbGlkb3MgPSAwCiAgICAgICAgICAgICAgICB3aGlsZSBsaWRvcyA8IG5fYWx2bzoKICAgICAgICAgICAgICAgICAgICBjaHVuayA9IHNlbGYucmZpbGUucmVhZChtaW4oMTAyNCAqIDEwMjQsIG5fYWx2byAtIGxpZG9zKSkKICAgICAgICAgICAgICAgICAgICBpZiBub3QgY2h1bms6CiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrCiAgICAgICAgICAgICAgICAgICAgbGlkb3MgKz0gbGVuKGNodW5rKQogICAgICAgICAgICAgICAgZHQgPSB0aW1lLnRpbWUoKSAtIHQwCiAgICAgICAgICAgICAgICBwYXJ0ZSA9IGludChxLmdldCgicGFydGUiLCBbIjAiXSlbMF0pCiAgICAgICAgICAgICAgICBFU1RBRE9bInRvdGFsIl0gKz0gbGlkb3MKICAgICAgICAgICAgICAgIEVTVEFET1sicGFydGVzIl0uYXBwZW5kKHsicGFydGUiOiBwYXJ0ZSwgImJ5dGVzIjogbGlkb3MsICJzIjogcm91bmQoZHQsIDMpfSkKICAgICAgICAgICAgICAgIHNlbGYuc2VuZF9qc29uKHsKICAgICAgICAgICAgICAgICAgICAicGFydGUiOiBwYXJ0ZSwKICAgICAgICAgICAgICAgICAgICAicGFydGVfYnl0ZXMiOiBsaWRvcywKICAgICAgICAgICAgICAgICAgICAicGFydGVfcyI6IHJvdW5kKGR0LCAzKSwKICAgICAgICAgICAgICAgICAgICAidG90YWxfYWN1bSI6IEVTVEFET1sidG90YWwiXSwKICAgICAgICAgICAgICAgIH0pCiAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICBzZWxmLnNlbmRfanNvbih7ImVycm8iOiAicm90YSBkZXNjb25oZWNpZGEifSwgNDA0KQogICAgICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICAgICAgc2VsZi5zZW5kX2pzb24oeyJlcnJvIjogc3RyKGUpWzozMDBdfSwgNTAwKQoKClRocmVhZGluZ0hUVFBTZXJ2ZXIoKCIwLjAuMC4wIiwgODA4MCksIEgpLnNlcnZlX2ZvcmV2ZXIoKQo=";

export class BancadaContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "3m";
  entrypoint = [
    "python3",
    "-c",
    "import base64,sys;exec(base64.b64decode(sys.argv[1]).decode())",
    HARNESS_B64,
  ];
}

const CHAVE_OBJETO = "bancada-e5/objeto-teste-256m.bin";
const CHAVE_PDF = "bancada-e5/documento.pdf";
const PARTE = 32 * 1024 * 1024;
const N_PARTES = 8;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/preparar" && request.method === "POST") {
        const up = await env.DERIVADOS.createMultipartUpload(CHAVE_OBJETO);
        const partes = [];
        for (let i = 1; i <= N_PARTES; i++) {
          const buf = new Uint8Array(PARTE);
          for (let j = 0; j < PARTE; j += 4096) buf[j] = (i * 7 + j / 4096) % 251;
          const p = await up.uploadPart(i, buf);
          partes.push(p);
        }
        const obj = await up.complete(partes);
        return Response.json({ ok: true, chave: CHAVE_OBJETO, bytes: N_PARTES * PARTE, partes: N_PARTES, etag: obj.etag });
      }
      if (url.pathname === "/receber-pdf" && request.method === "PUT") {
        const body = await request.arrayBuffer();
        const obj = await env.DERIVADOS.put(CHAVE_PDF, body);
        return Response.json({ ok: true, chave: CHAVE_PDF, bytes: body.byteLength, etag: obj.etag });
      }
      if (url.pathname === "/documento.pdf") {
        const obj = await env.DERIVADOS.get(CHAVE_PDF);
        if (!obj) return Response.json({ erro: "pdf ausente" }, { status: 404 });
        return new Response(obj.body, { headers: { "Content-Type": "application/pdf" } });
      }
      if (url.pathname === "/objeto.bin") {
        const head = await env.DERIVADOS.head(CHAVE_OBJETO);
        if (!head) return Response.json({ erro: "objeto ausente" }, { status: 404 });
        const range = request.headers.get("Range");
        if (range) {
          const m = /bytes=(\d+)-(\d*)/.exec(range);
          if (m) {
            const inicio = Number(m[1]);
            const fim = m[2] ? Number(m[2]) : head.size - 1;
            const obj = await env.DERIVADOS.get(CHAVE_OBJETO, { range: { offset: inicio, length: fim - inicio + 1 } });
            return new Response(obj.body, {
              status: 206,
              headers: {
                "Content-Range": "bytes " + inicio + "-" + fim + "/" + head.size,
                "Content-Length": String(fim - inicio + 1),
              },
            });
          }
        }
        const obj = await env.DERIVADOS.get(CHAVE_OBJETO);
        return new Response(obj.body, { headers: { "Content-Length": String(head.size) } });
      }
      if (url.pathname === "/estado") {
        const o = await env.DERIVADOS.head(CHAVE_OBJETO);
        const p = await env.DERIVADOS.head(CHAVE_PDF);
        return Response.json({
          objeto: o ? { bytes: o.size, etag: o.etag } : null,
          pdf: p ? { bytes: p.size, etag: p.etag } : null,
        });
      }
      if (url.pathname === "/extrair-push" && request.method === "POST") {
        const obj = await env.DERIVADOS.get(CHAVE_PDF);
        if (!obj) return Response.json({ erro: "pdf ausente" }, { status: 404 });
        const buf = await obj.arrayBuffer();
        const container = getContainer(env.BANCADA, "principal-v2");
        const t0 = Date.now();
        const resp = await container.fetch(new Request("http://container/extrair", {
          method: "POST",
          body: buf,
          headers: { "Content-Type": "application/pdf" },
        }));
        const data = await resp.json();
        return Response.json({ ...data, worker_envio_total_s: Math.round((Date.now() - t0)) / 1000 });
      }
      if (url.pathname === "/vazao-push" && request.method === "GET") {
        const container = getContainer(env.BANCADA, "principal-v2");
        const partes = [];
        let totalBytes = 0;
        let totalS = 0;
        for (let i = 1; i <= N_PARTES; i++) {
          const obj = await env.DERIVADOS.get(CHAVE_OBJETO, { range: { offset: (i - 1) * PARTE, length: PARTE } });
          if (!obj) return Response.json({ erro: "objeto ausente" }, { status: 404 });
          const buf = await obj.arrayBuffer();
          const qs = i === 1 ? "?parte=1&reset=1" : "?parte=" + i;
          const resp = await container.fetch(new Request("http://container/vazao-parte" + qs, { method: "POST", body: buf }));
          const d = await resp.json();
          if (d.erro) return Response.json({ erro: "container: " + d.erro, partes }, { status: 502 });
          partes.push(d);
          totalBytes = d.total_acum;
          totalS += d.parte_s;
        }
        return Response.json({
          modelo: "push por faixas de 32 MiB (Worker le R2 por Range e envia ao Container)",
          bytes: totalBytes,
          soma_partes_s: Math.round(totalS * 1000) / 1000,
          mb_s: Math.round((totalBytes / totalS / 1e6) * 100) / 100,
          partes,
        });
      }
      const container = getContainer(env.BANCADA, "principal-v2");
      return await container.fetch(request);
    } catch (e) {
      return Response.json({ erro: String(e && e.message ? e.message : e) }, { status: 500 });
    }
  },
};
