export function add(a: number, b: number): number {
  return a + b;
}

export function filterObj(
  obj: Record<string, any>,
  ...allowedFields: string[]
): Record<string, any> {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}
