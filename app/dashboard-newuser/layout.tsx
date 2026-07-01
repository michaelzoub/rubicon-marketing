import type { ReactNode } from "react";
import { DashboardShell } from "../dashboard/_components/shell";

export default function NewUserDashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
