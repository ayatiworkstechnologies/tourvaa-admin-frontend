import { MenuItem } from "@/types/auth";
import Header from "@/components/layout/Header";

type AdminHeaderProps = {
  title?: string;
  name?: string;
  profileImage?: string;
  role?: string;
  menus: MenuItem[];
  onMenuClick?: () => void;
};

export default function AdminHeader(props: AdminHeaderProps) {
  return <Header {...props} theme="navy" />;
}
