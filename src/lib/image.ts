/**
 * Reduz uma foto para um quadrado pequeno em JPEG (data URL).
 * Foto de celular tem vários MB; 256 px a ~0,8 de qualidade fica em torno de 20 KB,
 * leve o bastante para ir no banco local e sincronizar com o sócio.
 */
export async function photoToAvatar(file: File, size = 256, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Não foi possível ler esta imagem. Tente outra foto.");
  });

  // Recorte central quadrado.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}
