import { IS_NATIVE } from "../platform";

export async function readFileAsDataUrl(path: string): Promise<string | null> {
  if (!IS_NATIVE) return null;

  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Cache,
    });
    return `data:image/jpeg;base64,${result.data}`;
  } catch {
    return null;
  }
}

export async function writeTempFile(
  base64Data: string,
  fileName: string,
): Promise<string | null> {
  if (!IS_NATIVE) return null;

  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });
    return fileName;
  } catch {
    return null;
  }
}

export async function deleteTempFile(path: string): Promise<void> {
  if (!IS_NATIVE) return;

  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    await Filesystem.deleteFile({ path, directory: Directory.Cache });
  } catch {
    // File may not exist — ignore
  }
}
