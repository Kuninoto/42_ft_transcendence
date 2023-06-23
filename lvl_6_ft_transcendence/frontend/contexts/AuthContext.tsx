import { api } from "@/api/api";
import { ReactNode, createContext, useContext, useState } from "react";

interface IUser {
  name: string;
}

type authContextType = {
  user: IUser | {};
  login: (code: string) => Promise<boolean> | void;
};

const authContextDefaultValues: authContextType = {
  user: {},
  login: (code: string) => {},
};

const AuthContext = createContext<authContextType>(authContextDefaultValues);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<
    | {
        name: string;
      }
    | {}
  >({});

  const login = async (code: string) => {
    return await api
      .get(`/auth/${code}`)
      .then((result) => {
        console.log(result.data);
        setUser(result.data);
        return true;
      })
      .catch((err) => {
        console.error(err);
        return false;
      });
  };

  const value: authContextType = {
    user,
    login,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
