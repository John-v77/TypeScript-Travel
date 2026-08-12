import { useEffect, ReactNode } from "react";
import { useDispatch } from "react-redux";
import { checkTokenExpiry } from "../../features/authSlice/authStorageSlice";

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkTokenExpiry());

    const interval = setInterval(
      () => {
        dispatch(checkTokenExpiry());
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthGuard;
