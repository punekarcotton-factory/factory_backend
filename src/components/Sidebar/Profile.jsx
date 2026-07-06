// src/components/ProfileModal.jsx
import styled from "@emotion/styled";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";

const StyledDialog = styled(Dialog)({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    minWidth: "400px",
  },
});

const ProfileHeader = styled(DialogTitle)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px",
  backgroundColor: "#f8fafc",
});

const ProfileContent = styled(DialogContent)({
  padding: "24px",
});

const ProfileField = styled(Box)({
  marginBottom: "16px",
});

const FieldLabel = styled(Typography)({
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

const FieldValue = styled(Typography)({
  fontSize: "16px",
  fontWeight: 500,
  color: "#1e293b",
});

const LogoutButton = styled(Button)({
  marginTop: "16px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#ef4444",
  color: "#ffffff",
  fontWeight: 600,
  borderRadius: "8px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#dc2626",
  },
  "&:disabled": {
    backgroundColor: "#fca5a5",
    color: "#ffffff",
  },
});

const Profile = ({ open, handleClose, user, onLogout, loading }) => {
  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="sm">
      <ProfileHeader>
        <Typography variant="h6" fontWeight={700}>
          Profile Information
        </Typography>
        <IconButton onClick={handleClose} size="small">
          ✕
        </IconButton>
      </ProfileHeader>

      <Divider />

      <ProfileContent>
        <ProfileField>
          <FieldLabel>Full Name</FieldLabel>
          <FieldValue>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : "N/A"}
          </FieldValue>
        </ProfileField>

        <ProfileField>
          <FieldLabel>Email Address</FieldLabel>
          <FieldValue>{user?.email || "N/A"}</FieldValue>
        </ProfileField>

        <ProfileField>
          <FieldLabel>Phone Number</FieldLabel>
          <FieldValue>{user?.phone || "N/A"}</FieldValue>
        </ProfileField>

        <ProfileField>
          <FieldLabel>Role</FieldLabel>
          <FieldValue>{user?.roleName || "User"}</FieldValue>
        </ProfileField>

        <Divider sx={{ my: 2 }} />

        <LogoutButton onClick={onLogout} disabled={loading}>
          {loading ? "Logging out..." : "Logout"}
        </LogoutButton>
      </ProfileContent>
    </StyledDialog>
  );
};

export default Profile;