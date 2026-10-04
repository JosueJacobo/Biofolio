import React, { useState } from 'react';
import { Download, WifiOff, Share, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#0F291E] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#173D2D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Instalar aplicación para uso sin conexión"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#141E19]/20 text-xs font-medium text-[#141E19] hover:bg-[#EFECE6] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#F7F6F2] p-6 border border-[#141E19]/10 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#141E19] font-serif">
                  Instalar en iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#526058] hover:text-[#141E19]"
                  aria-label="Cerrar guía"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[#526058] leading-relaxed">
                Para guardar Biofolio en tu pantalla de inicio y usar tu colección sin conexión:
              </p>
              <ol className="mt-3 space-y-2 text-sm text-[#141E19]">
                <li className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#0F291E] font-semibold">01.</span>
                  <span>
                    Toca el botón <strong>Compartir</strong>
                  </span>
                  <Share className="w-4 h-4 text-[#0F291E] inline" />
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#0F291E] font-semibold">02.</span>
                  <span>
                    Selecciona <strong>Agregar a inicio</strong>
                  </span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#0F291E] text-white text-sm font-medium hover:bg-[#173D2D] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ pendingCount?: number }> = ({ pendingCount = 0 }) => {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 flex items-center gap-2 rounded-xl bg-[#141E19] px-3.5 py-2 text-xs font-medium text-[#F7F6F2] shadow-lg border border-white/10">
      <WifiOff className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
      <span>
        {!isOnline
          ? 'Modo Offline activo · Tu colección sigue disponible'
          : `Sincronizando ${pendingCount} hallazgo(s) guardado(s)...`}
      </span>
    </div>
  );
};
