export const PREVIEW_WORKSPACE_NAME_KEY = "freescale-preview-workspace-name";
export const PREVIEW_WORKSPACE_NAME_EVENT = "freescale:workspace-name-change";
export const DEFAULT_PREVIEW_WORKSPACE_NAME = "Espace de Wacil";

export function savePreviewWorkspaceName(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return;
  window.localStorage.setItem(PREVIEW_WORKSPACE_NAME_KEY, normalizedName);
  window.dispatchEvent(
    new CustomEvent(PREVIEW_WORKSPACE_NAME_EVENT, {
      detail: normalizedName,
    }),
  );
}
