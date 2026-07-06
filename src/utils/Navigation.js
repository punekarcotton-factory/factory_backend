import { AssignmentReturn, Inventory2Outlined } from "@mui/icons-material";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import { DELIVERY_MEMO_STAGES_ARRAY } from "./deliveryMemo";

export const NAVBAR = [
  {
    name: "Dashboard",
    icon: GridViewOutlined,
    route: "/dashboard",
  },
  {
    name: "Users",
    icon: GroupOutlined,
    route: "/users",
  },
  {
    name: "Delivery Memo",
    icon: Inventory2Outlined,
    route: "/delivery-memo",
    submenu: DELIVERY_MEMO_STAGES_ARRAY.map((stage) => ({
      name: stage.label,
      route: `/delivery-memo/${stage.key.toLowerCase().replace(/_/g, "-")}`,
      stageKey: stage.key,
      stageId: stage.id,
    })),
  },
  {
    name: "Return & Damage",
    icon: AssignmentReturn,
    route: "/returns",
  },
];

export const getNavItems = () => {
  return NAVBAR;
};

export const getPageTitle = (pathname) => {
  const matchedItem = NAVBAR.find((item) => pathname.startsWith(item.route));
  return matchedItem?.name || "Dashboard";
};
