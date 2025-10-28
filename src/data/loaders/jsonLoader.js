export async function loadJSONFile(file) {
  if (!file) throw new Error("No file");
  const text = await file.text();
  return JSON.parse(text);
}
