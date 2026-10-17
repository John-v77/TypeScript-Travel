import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppDispatch } from "../../app/hooks";
import { checkTokenExpiry } from "../../features/authSlice/authStorageSlice";

type AuthGuardProps = {
  children: ReactNode;
};

const AuthGuard = ({ children }: AuthGuardProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkTokenExpiry());

    const interval = setInterval(
      () => {
        dispatch(checkTokenExpiry());
      },
      5 * 60 * 1000,
    );

    return () => {
      clearInterval(interval);
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthGuard;
