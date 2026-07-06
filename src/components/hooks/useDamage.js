// hooks/useDamage.js
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";


import axiosInstance from "../../utils/axiosInstance";
import { showSnackbar } from "../../Slice/snackbarSlice";

export const useDamage = (stage, onSuccess) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [damageItem, setDamageItem] = useState(null);
  const [damageQuantity, setDamageQuantity] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [damageLoading, setDamageLoading] = useState(false);

  const openDamageModal = (item) => {
    setDamageItem(item);
    setDamageQuantity("");
    setDamageNotes("");
    setDamageModalOpen(true);
  };

  const handleMarkDamage = async () => {
    if (!damageItem?._id || !damageQuantity) {
      dispatch(showSnackbar({ open: true, severity: "error", message: "Please enter damaged quantity" }));
      return;
    }
    try {
      setDamageLoading(true);
      await axiosInstance.patch(`/delivery-memos/items/${damageItem._id}/damage`, {
        damagedQuantity: Number(damageQuantity),
        notes: damageNotes,
        stage,
        performedBy: user?._id || user?.id,
      });
      dispatch(showSnackbar({ open: true, severity: "success", message: "Damage recorded successfully" }));
      setDamageModalOpen(false);
      await onSuccess?.();
    } catch (error) {
      dispatch(showSnackbar({ open: true, severity: "error", message: error?.response?.data?.message || "Failed to record damage" }));
    } finally {
      setDamageLoading(false);
    }
  };

  return { damageModalOpen, setDamageModalOpen, damageItem, damageQuantity, setDamageQuantity, damageNotes, setDamageNotes, damageLoading, openDamageModal, handleMarkDamage };
};