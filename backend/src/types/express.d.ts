import type { Rol } from "../../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        rut: number;
        rol: Rol;
      };
    }
  }
}

export {};