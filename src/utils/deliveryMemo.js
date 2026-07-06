export const DELIVERY_MEMO_STAGES = {
  CREATE_DELIVERY_MEMO: {
    id: 1,
    label: "Create Delivery Memo",
    key: "CREATE_DELIVERY_MEMO",
  },
  CUTTING: {
    id: 2,
    label: "Cutting",
    key: "CUTTING",
  },
  ASSIGN_PRE_STITCHER: {
    id: 3,
    label: "Assign Pre Stitcher",
    key: "ASSIGN_PRE_STITCHER",
  },
  ADMIN_ASSIGN_TAILOR: {
    id: 4,
    label: "Admin Assign Tailor",
    key: "ADMIN_ASSIGN_TAILOR",
  },
  KANCH_BUTTON: {
    id: 5,
    label: "Kanch Button",
    key: "KANCH_BUTTON",
  },

};

// Convert to array for easy mapping
export const DELIVERY_MEMO_STAGES_ARRAY = Object.values(DELIVERY_MEMO_STAGES);

export const getMemoTitle = (memo) => {
  if (memo.dmNumber && memo.dmNumber.trim() !== "") return memo.dmNumber;
  if (memo.title && memo.title.trim() !== "") return memo.title;
  if (memo.items?.[0]?.fabricSKU && memo.items[0].fabricSKU.trim() !== "") return memo.items[0].fabricSKU;
  if (memo.items?.[0]?.shirtSKUs?.[0]?.sku && memo.items[0].shirtSKUs[0].sku.trim() !== "") return memo.items[0].shirtSKUs[0].sku;
  return "N/A";
};