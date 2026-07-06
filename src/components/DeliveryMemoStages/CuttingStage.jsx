import { Edit, ExpandMore, Palette } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Skeleton,
  Typography,
  Grid,
  Chip,
  IconButton,
  MenuItem,
  Drawer,
  TextField,
  Tooltip,
} from "@mui/material";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { DELIVERY_MEMO_STAGES, getMemoTitle } from "../../utils/deliveryMemo";
import { showSnackbar } from "../../Slice/snackbarSlice";
import NoResponsePage from "../../pages/NoResponsePage";
import { CreateButton } from "../Styled";
import EditShirtDetailsModal from "../../Modals/Editshirtdetailsmodal";
import MemoDetailDrawer from "../../Modals/MemoDetailDrawer";
import PartialAssignModal from "../../Modals/PartialAssignModal";
import { resolveImageUrl } from "../../config";
import moment from "moment";

const CuttingStage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailDrawer, setDetailDrawer] = useState({ open: false, memo: null });
  const [editModal, setEditModal] = useState({
    open: false,
    items: null,
    memoId: null,
  });
  const [partialModal, setPartialModal] = useState({
    open: false,
    memo: null,
  });
  const [partialLoading, setPartialLoading] = useState(false);

  const getUniqueColors = useMemo(
    () => (items) => {
      return [...new Set(items?.map((item) => item.fabricColor) || [])];
    },
    [],
  );

  const openDetailDrawer = useCallback((memo) => {
    setDetailDrawer({ open: true, memo });
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawer({ open: false, memo: null });
  }, []);

  const openEditModal = useCallback((memo, event) => {
    event.stopPropagation();
    setEditModal({
      open: true,
      items: memo.items,
      memoId: memo.deliveryMemoId,
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ open: false, items: null, memoId: null });
  }, []);

  const fetchCuttingMemos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/delivery-memos/by-stage", {
        params: { stage: DELIVERY_MEMO_STAGES.CUTTING.key },
      });
      const sorted = (response.data.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setMemos(sorted);
    } catch (error) {
      console.error("fetchCuttingMemos error", error);
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Failed to load cutting memos.",
        }),
      );
      setMemos([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const handleChangeStage = async (memoId) => {
    const memo = memos.find((m) => m.deliveryMemoId === memoId);
    if (!memo) return;

    const invalidItems = memo.items.filter(
      (item) =>
        !item.shirtSKUs ||
        item.shirtSKUs.length === 0 ||
        item.shirtSKUs.some((s) => !s.quantity || s.quantity <= 0),
    );

    if (invalidItems.length > 0) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: `Cannot move memo. ${invalidItems.length} items need shirt details.`,
        }),
      );
      return;
    }

    try {
      await axiosInstance.patch(`/delivery-memos/${memoId}/stage`, {
        stage: DELIVERY_MEMO_STAGES.ASSIGN_PRE_STITCHER.key,
        performedBy: user?._id,
      });
      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Stage updated successfully!",
        }),
      );
      fetchCuttingMemos();
    } catch (error) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: "Failed to update stage.",
        }),
      );
    }
  };

  const handlePartialAssignSubmit = async (payloadItems) => {
    try {
      setPartialLoading(true);
      await axiosInstance.post(
        `/delivery-memos/${partialModal.memo.deliveryMemoId}/partial-assign`,
        {
          items: payloadItems,
          performedBy: user?._id,
        },
      );
      dispatch(
        showSnackbar({
          open: true,
          severity: "success",
          message: "Partial assignment successful!",
        }),
      );
      setPartialModal({ open: false, memo: null });
      fetchCuttingMemos();
    } catch (error) {
      dispatch(
        showSnackbar({
          open: true,
          severity: "error",
          message: error.response?.data?.message || "Failed to partial assign.",
        }),
      );
    } finally {
      setPartialLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCuttingMemos();
    }
  }, [user, fetchCuttingMemos]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Skeleton
            variant="rectangular"
            width={{ xs: "100%", sm: 150 }}
            height={36}
          />
          <Skeleton
            variant="text"
            width={{ xs: "100%", sm: 200 }}
            height={40}
          />
        </Box>
        <Grid container spacing={2.5}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={160}
                sx={{ borderRadius: "12px" }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {memos.length === 0 ? (
        <NoResponsePage />
      ) : (
        <Grid container spacing={2.5}>
          {memos.map((memo) => {
            const uniqueColors = getUniqueColors(memo.items);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={memo.deliveryMemoId}>
                <Card
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    height: "400px",
                    width: "350px",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        mb: 1,
                        pb: 1,
                        borderBottom: "2px solid #e5e7eb",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                          gap: 1,
                        }}
                      >
                        <Tooltip
                          title={getMemoTitle(memo)}
                          arrow
                          placement="top"
                        >
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "15px",
                              color: "#111827",
                              cursor: "default",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              minHeight: "22px", // Adjusted from 44px since it's now 1 line
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {getMemoTitle(memo)}
                          </Typography>
                        </Tooltip>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Chip
                            label={
                              memo.items?.length === 1
                                ? "1 Item"
                                : `${memo.items?.length || 0} Items`
                            }
                            size="small"
                            sx={{
                              backgroundColor: "#dbeafe",
                              color: "#1e40af",
                              fontWeight: 600,
                              fontSize: "11px",
                              height: "22px",
                            }}
                          />
                          {(() => {
                            const totalShirts = memo.items?.reduce(
                              (sum, item) =>
                                sum +
                                (item.shirtSKUs?.reduce(
                                  (sSum, s) => sSum + (s.quantity || 0),
                                  0,
                                ) || 0),
                              0,
                            );
                            if (totalShirts > 0) {
                              return (
                                <Chip
                                  label={`${totalShirts} shirts remaining`}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#fff7ed",
                                    color: "#9a3412",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    height: "22px",
                                    border: "1px solid #ffedd5",
                                  }}
                                />
                              );
                            }
                            return null;
                          })()}
                        </Box>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#6b7280",
                        }}
                      >
                        {moment.utc(memo.createdAt).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        mb: 0.5,
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ mb: 1.5, flexShrink: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#6b7280",
                            fontWeight: 600,
                            mb: 0.5,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Colors
                        </Typography>
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          {uniqueColors.slice(0, 3).map((color, idx) => (
                            <Chip
                              key={idx}
                              icon={<Palette sx={{ fontSize: 14 }} />}
                              label={color}
                              size="small"
                              sx={{
                                fontSize: "11px",
                                height: "22px",
                                backgroundColor: "#f3f4f6",
                              }}
                            />
                          ))}
                          {uniqueColors.length > 3 && (
                            <Tooltip
                              title={uniqueColors.join(", ")}
                              arrow
                              placement="top"
                            >
                              <Chip
                                label={`+${uniqueColors.length - 3}`}
                                size="small"
                                sx={{
                                  fontSize: "11px",
                                  height: "22px",
                                  backgroundColor: "#f3f4f6",
                                  cursor: "default",
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          p: 1,
                          minHeight: "80px",
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#6b7280",
                              fontWeight: 600,
                              mb: 0.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Total Allocated
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#466d61",
                            }}
                          >
                            {memo.totalDhapFold} m
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#6b7280",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Status:{" "}
                            {memo.items?.every(
                              (item) =>
                                item.shirtSKUs &&
                                item.shirtSKUs.length > 0 &&
                                item.shirtSKUs.every((s) => s.quantity > 0),
                            )
                              ? "Ready"
                              : "Incomplete"}
                          </Typography>
                        </Box>
                        {/* <Box>
                          <Typography sx={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Created on
                          </Typography>
                          <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#466d61" }}>
                            {new Date(memo.updatedAt).toLocaleDateString()}
                          </Typography>
                        </Box> */}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 0.5, flexShrink: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "11px",
                          color: "#3b82f6",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          mb: 1,
                        }}
                      >
                        Shirt Details
                      </Typography>

                      {memo.items?.every(
                        (item) =>
                          item.shirtSKUs &&
                          item.shirtSKUs.length > 0 &&
                          item.shirtSKUs.every((s) => s.quantity > 0),
                      ) ? (
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(memo, e);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1.5,
                            backgroundColor: "#f0f9ff",
                            borderRadius: "6px",
                            border: "1px solid #e0f2fe",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              backgroundColor: "#dbeafe",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: "#10b981",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                color: "white",
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </Box>
                            <Typography
                              sx={{
                                fontSize: "11px",
                                color: "#166534",
                                fontWeight: 600,
                              }}
                            >
                              All items configured • Click to edit
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{
                              color: "#3b82f6",
                              padding: "2px",
                              "&:hover": {
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                              },
                            }}
                          >
                            <Edit sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(memo, e);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1.5,
                            backgroundColor: "#fef2f2",
                            borderRadius: "6px",
                            border: "1px solid #fecaca",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              backgroundColor: "#fee2e2",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                color: "white",
                                fontWeight: 700,
                              }}
                            >
                              {
                                memo.items?.filter(
                                  (item) =>
                                    !item.shirtSKUs ||
                                    item.shirtSKUs.length === 0 ||
                                    item.shirtSKUs.some(
                                      (s) => !s.quantity || s.quantity <= 0,
                                    ),
                                ).length
                              }
                            </Box>
                            <Typography
                              sx={{
                                fontSize: "11px",
                                color: "#dc2626",
                                fontWeight: 600,
                              }}
                            >
                              {
                                memo.items?.filter(
                                  (item) =>
                                    !item.shirtSKUs ||
                                    item.shirtSKUs.length === 0 ||
                                    item.shirtSKUs.some(
                                      (s) => !s.quantity || s.quantity <= 0,
                                    ),
                                ).length
                              }{" "}
                              item
                              {memo.items?.filter(
                                (item) =>
                                  !item.shirtSKUs ||
                                  item.shirtSKUs.length === 0 ||
                                  !item.shirtQuantity,
                              ).length !== 1
                                ? "s"
                                : ""}{" "}
                              need setup • Click to configure
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{
                              color: "#dc2626",
                              padding: "2px",
                              "&:hover": {
                                backgroundColor: "rgba(220, 38, 38, 0.1)",
                              },
                            }}
                          >
                            <Edit sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        mt: "auto",
                        flexShrink: 0,
                      }}
                    >
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => openDetailDrawer(memo)}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          height: "38px",
                          borderColor: "#667eea",
                          color: "#667eea",
                          "&:hover": {
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                          },
                        }}
                      >
                        View Details
                      </Button>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            flex: 1,
                            textTransform: "none",
                            fontSize: "12px",
                            height: "36px",
                            borderColor: "#3b82f6",
                            color: "#3b82f6",
                          }}
                          onClick={() => setPartialModal({ open: true, memo })}
                        >
                          Partial Assign
                        </Button>
                        <CreateButton
                          variant="contained"
                          size="small"
                          sx={{ flex: 1, height: "36px" }}
                          onClick={() => handleChangeStage(memo.deliveryMemoId)}
                        >
                          Complete Assign
                        </CreateButton>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Edit Shirt Details Modal */}
      <EditShirtDetailsModal
        open={editModal.open}
        onClose={closeEditModal}
        items={editModal.items}
        memoId={editModal.memoId}
        onSuccess={fetchCuttingMemos}
      />

      {/* Detail Drawer */}
      <MemoDetailDrawer
        open={detailDrawer.open}
        onClose={closeDetailDrawer}
        memo={detailDrawer.memo}
        title="Delivery Memo Details"
      />

      {/* Partial Assign Modal */}
      <PartialAssignModal
        open={partialModal.open}
        onClose={() => setPartialModal({ open: false, memo: null })}
        memo={partialModal.memo}
        onSubmit={handlePartialAssignSubmit}
        loading={partialLoading}
      />
    </Box>
  );
};

export default CuttingStage;
