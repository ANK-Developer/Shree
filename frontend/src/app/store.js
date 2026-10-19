import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import adminsReducer from "../features/admins/adminsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admins: adminsReducer,
  },
});
