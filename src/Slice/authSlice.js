import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      if (!identifier || !password) {
        return rejectWithValue("Email/Phone and password are required");
      }

      const payload = { password };

      const trimmedIdentifier = String(identifier).trim();
      const isEmail = trimmedIdentifier.includes("@");
      
      if (isEmail) {
        payload.email = trimmedIdentifier;
      } else {
        payload.phone = trimmedIdentifier;
      }

      const response = await axiosInstance.post("/login", payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/logout");
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("auth");
    },
    loadUserFromStorage: (state) => {
      const saved = localStorage.getItem("auth");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          state.user = parsed.user;
          state.token = parsed.token;
        } catch (error) {
          console.error("Failed to parse auth from storage", error);
          localStorage.removeItem("auth");
        }
      }
    },
    setUserData: (state, action) => {
      state.user = action.payload;
      const auth = localStorage.getItem("auth");
      if (auth) {
        try {
          const parsed = JSON.parse(auth);
          parsed.user = action.payload;
          localStorage.setItem("auth", JSON.stringify(parsed));
        } catch (error) {
          console.error("Failed to update user data", error);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token || "cookie-auth";

        localStorage.setItem(
          "auth",
          JSON.stringify({
            user: action.payload.user,
            token: action.payload.token || "cookie-auth",
          })
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("auth");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem("auth");
        state.error = action.payload;
      });
  },
});

export const { logout, loadUserFromStorage, setUserData } = authSlice.actions;
export default authSlice.reducer;