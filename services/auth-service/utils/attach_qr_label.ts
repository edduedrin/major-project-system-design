import sharp from "sharp";

export async function attachToLabel(
  qrBuffer: Buffer,
  templateBuffer: Buffer,
  serialNumber: string,
  trwNumber: string
): Promise<Buffer> {

  const template = sharp(templateBuffer);
  const meta = await template.metadata();

  const width = meta.width!;
  const height = meta.height!;

  const qrLeft = Math.floor(width * 0.048);
  const qrTop = Math.floor(height * 0.055);

  const serialX = Math.floor(width * 0.685);
  const serialY = Math.floor(height * 0.77);

  const trwX = Math.floor(width * 0.685);
  const trwY = Math.floor(height * 0.67);

  const svgText = `
<svg width="${width}" height="${height}">
<style>
.text {
  fill: #000;
  font-size: 32px;
  font-family: "DejaVu Sans", Arial, sans-serif;
}
</style>

<text x="${trwX}" y="${trwY}" class="text">${trwNumber}</text>
<text x="${serialX}" y="${serialY}" class="text">${serialNumber}</text>

</svg>
`;

  const finalImage = await template
    .composite([
      { input: qrBuffer, left: qrLeft, top: qrTop },
      { input: Buffer.from(svgText), top: 0, left: 0 }
    ])
    .png()
    .toBuffer();

  return finalImage;
}