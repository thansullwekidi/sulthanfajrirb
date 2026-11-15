import { z } from "zod";
import { isSafeHttpUrl, isSafeImageUrl } from "./primitives";

/** Ubah ZodError menjadi peta galat per kolom formulir. */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export const nonEmptyText = (label: string, min: number, max: number) =>
  z
    .string({ required_error: `${label} wajib diisi.` })
    .trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`);

/** URL opsional: kosong diperbolehkan, selain itu wajib http(s). */
export const optionalHttpUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500, `${label} terlalu panjang.`)
    .refine((value) => value === "" || isSafeHttpUrl(value), {
      message: `${label} harus diawali https:// atau http:// yang valid.`
    });

/**
 * URL gambar opsional. Berbeda dari `optionalHttpUrl`, nilai boleh berupa
 * aset unggahan Studio (`/api/v1/media/<id>`) selain URL http(s) eksternal.
 */
export const optionalImageUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500, `${label} terlalu panjang.`)
    .refine((value) => value === "" || isSafeImageUrl(value), {
      message: `${label} harus berupa URL http(s) atau aset media yang diunggah.`
    });

export const optionalDateIso = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), {
      message: `${label} bukan tanggal yang valid.`
    });

export const emailField = z
  .string({ required_error: "Alamat surel wajib diisi." })
  .trim()
  .min(5, "Alamat surel terlalu pendek.")
  .max(180, "Alamat surel terlalu panjang.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Format alamat surel tidak valid.");
