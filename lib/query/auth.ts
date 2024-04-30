import { useMutation } from "@tanstack/react-query";
import { INewUser } from "@/types";
import {
  signInAccount,
  signOutAccount,
  createUserAccount,
} from "@/lib/appwrite/user";

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};
