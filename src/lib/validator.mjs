import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, removeAdditional: "all" });

export function validate(schema, data) {
  const check = ajv.compile(schema);
  const ok = check(data);
  return { ok, errors: check.errors || [] };
}
