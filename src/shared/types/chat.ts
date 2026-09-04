/** Xabar menyusida qaysi amallar ko‘rsatilishi (backend qo‘llab-quvvatlashiga qarab). */
export interface MessageCapabilities {
  reply: boolean;
  edit: boolean;
  delete: boolean;
  react: boolean;
}
