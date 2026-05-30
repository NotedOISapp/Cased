const res = await fetch("http://127.0.0.1:3000/api/trpc/admin.listCases");
const d = await res.json();
const cases = d?.result?.data?.json ?? [];
for (const c of cases) {
  if (c.id.includes("scott") || c.id.includes("delphi") || c.id.includes("peterson")) {
    console.log(c.id, "|", c.title);
  }
}
