import { Box } from "lucide-react";

export function Viewer3D({
  sketchfabModelId,
  titulo,
}: {
  sketchfabModelId: string;
  titulo: string;
}) {
  if (!sketchfabModelId) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 bg-museo-superficie px-6 text-center text-museo-suave">
        <Box size={36} strokeWidth={1.5} aria-hidden />
        <p>El modelo 3D de esta pieza aún no está disponible.</p>
      </div>
    );
  }

  return (
    <div className="aspect-[4/3] w-full overflow-hidden bg-museo-negro">
      <iframe
        title={`Modelo 3D interactivo: ${titulo}`}
        className="h-full w-full"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        src={`https://sketchfab.com/models/${encodeURIComponent(sketchfabModelId)}/embed?autostart=1&ui_hint=2&ui_theme=dark`}
      />
    </div>
  );
}
