import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export type PageImage = { base64: string; mediaType: string };

// pdfjs é pesado (~1 MB); import dinâmico para baixar somente quando o
// usuário pedir a leitura por IA, sem inflar o chunk do formulário.
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

// Laudos costumam ter poucas páginas; limite defensivo de custo/payload.
const MAX_PAGES = 10;
// Largura-alvo da página renderizada. ~1800px é o ponto em que texto de scan
// fica nítido para OCR por visão sem estourar o payload da Edge Function.
const TARGET_WIDTH = 1800;
const JPEG_QUALITY = 0.85;

// Converte um PDF em imagens JPEG de alta resolução, página a página, no
// próprio navegador (pdfjs). Motivo: ao enviar o PDF bruto para a OpenAI, a
// rasterização fica a cargo do provedor e sai em resolução baixa — scans
// densos viravam "[ilegível]". Renderizando localmente controlamos a nitidez
// e enviamos como image_url com detail: high.
export async function pdfFileToImages(file: File): Promise<PageImage[]> {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  try {
    const count = Math.min(doc.numPages, MAX_PAGES);
    const pages: PageImage[] = [];
    for (let i = 1; i <= count; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(3, Math.max(1.5, TARGET_WIDTH / base.width));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D indisponível neste navegador");
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      pages.push({
        base64: dataUrl.split(",")[1] ?? "",
        mediaType: "image/jpeg",
      });
    }
    return pages;
  } finally {
    await doc.destroy();
  }
}
