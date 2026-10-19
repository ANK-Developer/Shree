import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { TOKEN_KEY } from "../../services/api";

const errorMessage = (err) => err.response?.data?.message || "Something went wrong";

export const loginAdmin = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err));
  }
});

// Page refresh par token se user wapas load karta hai
export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (err) {
    localStorage.removeItem(TOKEN_KEY);
    return rejectWithValue(errorMessage(err));
  }
});

const token = localStorage.getItem(TOKEN_KEY);

const initialState = {
  user: null,
  token,
  // token hai to pehle /me se verify hoga
  checking: Boolean(token),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem(TOKEN_KEY);
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.token = payload.token;
      })
      .addCase(loginAdmin.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.checking = false;
        state.user = payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.checking = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
