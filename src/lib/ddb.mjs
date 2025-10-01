export function unmarshal(Item) {
  if (!Item) return null;
  const obj = {};
  for (const [k, v] of Object.entries(Item)) {
    if (v.S !== undefined) obj[k] = v.S;
    else if (v.N !== undefined) obj[k] = Number(v.N);
    else if (v.BOOL !== undefined) obj[k] = v.BOOL;
    else if (v.M !== undefined) obj[k] = unmarshal(v.M);
    else if (v.L !== undefined) obj[k] = v.L.map(unmarshal);
    else if (v.NULL) obj[k] = null;
    else obj[k] = v; // fallback
  }
  return obj;
}

export function unmarshalList(Items = []) {
  return Items.map(unmarshal);
}
