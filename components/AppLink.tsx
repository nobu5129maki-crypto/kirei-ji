import type { ComponentProps } from "react";
import { toBaseRelative } from "@/lib/paths";

export function AppLink({ href, ...props }: ComponentProps<"a"> & { href: string }) {
  return <a href={toBaseRelative(href)} {...props} />;
}
