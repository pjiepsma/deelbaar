import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { Provider } from "@/app/auth/auth";
import { createUserAccount } from "@/lib/appwrite/api";

export const useCreateUserAccountMutation = () => {
  // return useMutation(() => {
  //   mutationFn: () => createUserAccount()
  // });
};
