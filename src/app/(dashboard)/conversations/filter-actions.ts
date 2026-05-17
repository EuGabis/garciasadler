"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function setMineOnly(value: boolean): Promise<void> {
  const store = await cookies();
  store.set("conv_mine_only", value ? "1" : "0", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/conversations");
}
