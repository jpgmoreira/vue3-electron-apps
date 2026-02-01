// "base" will be null only the first time the front send it to the back.
export type MediaFile = {
  name: string; // Media display name.
  type: string; // Mime type.
  path: string; // Full file path.
  base: string | null; // File name with extension.
};
