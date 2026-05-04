import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktop', {
  getApiBase: (): Promise<string> => ipcRenderer.invoke('app:get-api-base'),
  saveCsvDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:save-csv', defaultName),
  openCsvDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog:open-csv'),
  openImageDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog:open-image'),
  platform: process.platform,
});

declare global {
  interface Window {
    desktop: {
      getApiBase: () => Promise<string>;
      saveCsvDialog: (defaultName: string) => Promise<string | null>;
      openCsvDialog: () => Promise<string | null>;
      openImageDialog: () => Promise<string | null>;
      platform: string;
    };
  }
}
