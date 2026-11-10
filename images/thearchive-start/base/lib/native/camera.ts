import { IS_NATIVE } from "../platform";

interface PhotoResult {
  /** base64-encoded image data */
  dataUrl: string;
  /** Native file path (platform-specific) */
  path?: string;
  format: string;
}

export async function takePhoto(): Promise<PhotoResult | null> {
  if (!IS_NATIVE) return null;

  try {
    const { Camera, CameraResultType, CameraSource } =
      await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });
    return {
      dataUrl: `data:image/jpeg;base64,${photo.base64String}`,
      path: photo.path,
      format: photo.format,
    };
  } catch {
    return null;
  }
}

export async function pickFromGallery(): Promise<PhotoResult | null> {
  if (!IS_NATIVE) return null;

  try {
    const { Camera, CameraResultType, CameraSource } =
      await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });
    return {
      dataUrl: `data:image/jpeg;base64,${photo.base64String}`,
      path: photo.path,
      format: photo.format,
    };
  } catch {
    return null;
  }
}
